import json
import os
import uuid
from typing import Any
import sqlite3

from langgraph.checkpoint.sqlite import SqliteSaver
from pathlib import Path
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.tools import tool
from langchain_core.messages import AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langchain_core.messages import AIMessage
from langgraph.types import Command

# ============================================================
# 1. 加载 LongCat 配置
# ============================================================

load_dotenv()

API_KEY = os.getenv("LONGCAT_API_KEY")
BASE_URL = os.getenv("LONGCAT_BASE_URL")
MODEL = os.getenv("LONGCAT_MODEL")

if not API_KEY:
    raise RuntimeError("没有读取到 LONGCAT_API_KEY")

if not BASE_URL:
    raise RuntimeError("没有读取到 LONGCAT_BASE_URL")

if not MODEL:
    raise RuntimeError("没有读取到 LONGCAT_MODEL")

# 当前只是命令行测试用户。
# 接入 App 后必须替换为后端认证得到的真实用户 ID。
CURRENT_USER_ID = "demo-user-001"

USER_MEMORY_DB = Path("user_memory.db")


# ============================================================
# 2. 模拟业务数据
# ============================================================

def initialize_user_memory_database() -> None:
    """
    创建长期用户资料表。
    如果表已经存在，不会重复创建。
    """

    with sqlite3.connect(USER_MEMORY_DB) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id TEXT PRIMARY KEY,
                name TEXT,
                current_project TEXT,
                updated_at DATETIME NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.commit()

TASKS: list[dict[str, Any]] = []

initialize_user_memory_database()



# ============================================================
# 3. 使用 LangChain 定义工具
# ============================================================

@tool
def get_exam_list() -> dict[str, Any]:
    """
    查询当前用户的考试列表。

    当用户询问考试科目、考试时间、最近考试或考试安排时使用。
    """

    return {
        "success": True,
        "exams": [
            {
                "subject": "计算机网络",
                "date": "2026-07-25",
            },
            {
                "subject": "软件工程",
                "date": "2026-07-30",
            },
        ],
    }


@tool
def create_study_task(
    title: str,
    due_date: str,
) -> dict[str, Any]:
    """
    创建一项学习任务。

    仅当用户明确要求创建、添加或安排任务时使用。

    参数：
    - title：只包含学习内容，不包含时间表达。
    - due_date：任务时间，例如“今晚”或具体日期。
    """

    task = {
        "id": len(TASKS) + 1,
        "title": title.strip(),
        "dueDate": due_date.strip(),
        "completed": False,
    }

    TASKS.append(task)

    return {
        "success": True,
        "task": task,
    }

@tool
def get_user_profile() -> dict[str, Any]:
    """
    查询当前用户的长期个人资料。

    当用户询问自己的姓名、正在开发的项目，
    或回答需要使用个人资料时调用。
    """

    with sqlite3.connect(USER_MEMORY_DB) as connection:
        connection.row_factory = sqlite3.Row

        row = connection.execute(
            """
            SELECT
                user_id,
                name,
                current_project,
                updated_at
            FROM user_profiles
            WHERE user_id = ?
            """,
            (CURRENT_USER_ID,),
        ).fetchone()

    if row is None:
        return {
            "success": True,
            "profileExists": False,
            "profile": None,
        }

    return {
        "success": True,
        "profileExists": True,
        "profile": {
            "userId": row["user_id"],
            "name": row["name"],
            "currentProject": row["current_project"],
            "updatedAt": row["updated_at"],
        },
    }

@tool
def save_user_profile(
    name: str,
    current_project: str,
) -> dict[str, Any]:
    """
    保存当前用户明确提供的长期个人资料。

    仅当用户明确说出姓名和当前开发项目时使用。
    不得保存模型自行推断的信息。
    """

    clean_name = name.strip()
    clean_project = current_project.strip()

    if not clean_name:
        return {
            "success": False,
            "error": "姓名不能为空。",
        }

    if not clean_project:
        return {
            "success": False,
            "error": "当前项目不能为空。",
        }

    confirmed = confirm_write_action(
        "保存长期用户资料",
        {
            "name": clean_name,
            "currentProject": clean_project,
        },
    )

    if not confirmed:
        return {
            "success": False,
            "cancelled": True,
            "message": "用户取消了长期资料保存。",
        }

    with sqlite3.connect(USER_MEMORY_DB) as connection:
        connection.execute(
            """
            INSERT INTO user_profiles (
                user_id,
                name,
                current_project
            )
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                name = excluded.name,
                current_project = excluded.current_project,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                CURRENT_USER_ID,
                clean_name,
                clean_project,
            ),
        )

        connection.commit()

    return {
        "success": True,
        "profile": {
            "userId": CURRENT_USER_ID,
            "name": clean_name,
            "currentProject": clean_project,
        },
    }

@tool
def delete_user_profile() -> dict[str, Any]:
    """
    删除当前用户保存的长期个人资料。

    仅当用户明确要求忘记、删除或清除资料时使用。
    """

    with sqlite3.connect(USER_MEMORY_DB) as connection:
        cursor = connection.execute(
            """
            DELETE FROM user_profiles
            WHERE user_id = ?
            """,
            (CURRENT_USER_ID,),
        )

        connection.commit()

    deleted = cursor.rowcount > 0

    return {
        "success": True,
        "deleted": deleted,
        "message": (
            "长期用户资料已删除。"
            if deleted
            else "当前没有已保存的长期用户资料。"
        ),
    }

# ============================================================
# 4. 创建 LongCat 模型适配器
# ============================================================

model = ChatOpenAI(
    model=MODEL,
    api_key=API_KEY,
    base_url=BASE_URL,
    timeout=60,
    max_retries=2,
)


# ============================================================
# 5. 系统提示词
# ============================================================

SYSTEM_PROMPT = """
你是 SYNC-STUDY 学习助手。

你的职责：
1. 回答学习相关问题。
2. 用户询问考试安排时，调用 get_exam_list。
3. 用户明确要求创建学习任务时，调用 create_study_task。
4. 不得捏造考试、任务或工具执行结果。
5. 只有工具返回 success=true 后，才能声称操作成功。
6. 工具返回 cancelled=true 时，告知用户操作已取消。
7. 同一次待审批操作被拒绝后，本轮不要自动重试。
8. 如果用户之后明确提出了新的操作请求，
9. 可以重新发起新的工具调用并再次请求审批。
10. 使用简洁、自然的中文回答。



创建任务时：
- title 只包含学习内容。
- 不要把“今晚”“明晚”等时间表达放入 title。
- 时间表达应放入 due_date。


长期用户资料规则：

1. 当用户明确说“我叫某某，我正在开发某项目”时，
    调用 save_user_profile 保存资料。

2. 只有用户明确提供的资料才能保存，不得自行推断姓名或项目。

3. 用户询问“我是谁”“我叫什么”“我在开发什么”时，
    调用 get_user_profile 查询长期资料。

4. 不得仅凭当前模型记忆声称已经长期保存，
    只有 save_user_profile 返回 success=true 后才能说明保存成功。

5. get_user_profile 返回 profileExists=false 时，
    应明确说明尚未保存长期资料。

6. 当前版本把用户主动提供姓名和项目视为允许保存。

长期记忆规则：

1. 只能保存用户明确提供的稳定资料，不得保存推断结果。
2. 不得把密码、API Key、Token 或其他秘密信息写入长期记忆。
3. 临时问题、一次性请求和普通聊天内容不应写入长期记忆。
4. 用户询问“你记得我什么”时，调用 get_user_profile。
5. 用户明确要求记住姓名和项目时，调用 save_user_profile。
6. 用户要求“忘记我”“删除我的资料”时，调用 delete_user_profile。
7. 保存和删除工具返回 cancelled=true 后，不得再次调用。
8. 只有工具返回 success=true 后，才能声称资料已保存或删除。
"""

# ============================================================
# 6. 创建 LangChain Agent
# ============================================================

memory_connection = sqlite3.connect(
    "agent_memory.db",
    check_same_thread=False,
)

checkpointer = SqliteSaver(memory_connection)

agent = create_agent(
    model=model,
    tools=[
        get_exam_list,
        create_study_task,
        get_user_profile,
        save_user_profile,
        delete_user_profile,
    ],
    system_prompt=SYSTEM_PROMPT,
    middleware=[
        HumanInTheLoopMiddleware(
            interrupt_on={
                # 查询操作直接执行
                "get_exam_list": False,
                "get_user_profile": False,

                # 写操作暂停，等待批准或拒绝
                "create_study_task": {
                    "allowed_decisions": [
                        "approve",
                        "reject",
                    ],
                },
                "save_user_profile": {
                    "allowed_decisions": [
                        "approve",
                        "reject",
                    ],
                },
                "delete_user_profile": {
                    "allowed_decisions": [
                        "approve",
                        "reject",
                    ],
                },
            },
            description_prefix="SYNC-STUDY 检测到待审批操作",
        ),
    ],
    checkpointer=checkpointer,
)

# ============================================================
# 7. 执行 Agent
# ============================================================

def extract_final_text(result: Any) -> str:
    """
    从 version='v2' 返回的 GraphOutput 中提取最后一条回答。
    """

    state = result.value

    messages = state.get("messages", [])

    if not messages:
        return "Agent 没有返回消息。"

    final_message = messages[-1]

    if not isinstance(final_message, AIMessage):
        return "Agent 暂未生成最终回答。"

    content = final_message.content

    if isinstance(content, str):
        return content

    return str(content)

def run_agent(
    user_input: str,
    thread_id: str,
) -> None:
    """
    执行 Agent。

    遇到写操作时：
    1. Agent 暂停并保存状态；
    2. 用户批准或拒绝；
    3. 使用同一个 thread_id 恢复执行。
    """

    config = {
        "configurable": {
            "thread_id": thread_id,
        }
    }

    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": user_input,
                }
            ]
        },
        config=config,
        version="v2",
    )

    # 一个任务可能连续出现多个 interrupt，
    # 因此使用 while，而不是只处理一次。
    while result.interrupts:
        decisions = review_interrupts(
            result.interrupts
        )

        result = agent.invoke(
            Command(
                resume={
                    "decisions": decisions,
                }
            ),
            config=config,
            version="v2",
        )

    final_text = extract_final_text(result)

    print("\nAgent：")
    print(final_text)

def review_interrupts(
    interrupts: tuple[Any, ...],
) -> list[dict[str, Any]]:
    """
    在终端展示暂停的动作，并收集用户决策。
    """

    decisions: list[dict[str, Any]] = []

    for interrupt_item in interrupts:
        payload = interrupt_item.value

        action_requests = payload.get(
            "action_requests",
            [],
        )

        review_configs = payload.get(
            "review_configs",
            [],
        )

        for index, action in enumerate(action_requests):
            tool_name = action.get("name")
            arguments = action.get("arguments")

            if arguments is None:
                arguments = action.get("args", {})
                
            description = action.get("description", "")

            print("\n==============================")
            print("Agent 已暂停，等待人工审批")
            print("==============================")

            if description:
                print(description)

            print(f"\n工具：{tool_name}")
            print("参数：")
            print(
                json.dumps(
                    arguments,
                    ensure_ascii=False,
                    indent=2,
                )
            )

            if index < len(review_configs):
                allowed = review_configs[index].get(
                    "allowed_decisions",
                    [],
                )
                print(f"允许的决策：{allowed}")

            while True:
                answer = input(
                    "\n批准请输入 y，拒绝请输入 n："
                ).strip().lower()

                if answer in {"y", "yes"}:
                    decisions.append(
                        {
                            "type": "approve",
                        }
                    )
                    break

                if answer in {"n", "no"}:
                    decisions.append(
                        {
                            "type": "reject",
                            "message": (
                                "用户拒绝了本次待审批操作。"
                                "本轮不要自动重试该调用。"
                                "如果用户之后明确发起新的创建请求，"
                                "可以重新提出新的工具调用。"
                            ),
                        }
                    )
                    break

                print("输入无效，请输入 y 或 n。")

    return decisions

# ============================================================
# 8. 命令行入口
# ============================================================

def main() -> None:
    print("SYNC-STUDY LangChain Agent V2F - HITL")
    print(f"当前模型：{MODEL}")
    print("输入 /new 创建新会话")
    print("输入 /thread 查看当前会话 ID")
    print("输入 /switch <会话ID> 切换会话")
    print("输入 exit 退出")

    thread_id = str(uuid.uuid4())

    print(f"当前会话：{thread_id}")

    while True:
        user_input = input("\n你：").strip()

        if user_input.lower() == "exit":
            print("Agent 已退出")
            break

        if user_input == "/new":
            thread_id = str(uuid.uuid4())

            print("已创建新会话")
            print(f"当前会话：{thread_id}")
            continue

        if user_input == "/thread":
            print(f"当前会话：{thread_id}")
            continue

        if user_input.startswith("/switch "):
            new_thread_id = user_input.removeprefix(
                "/switch "
            ).strip()

            if not new_thread_id:
                print("会话 ID 不能为空")
                continue

            thread_id = new_thread_id

            print("已切换会话")
            print(f"当前会话：{thread_id}")
            continue

        if not user_input:
            continue

        try:
            run_agent(
                user_input=user_input,
                thread_id=thread_id,
            )

        except Exception as exception:
            print("\nAgent 执行失败：")
            print(
                f"{type(exception).__name__}: "
                f"{exception}"
            )


if __name__ == "__main__":
    main()