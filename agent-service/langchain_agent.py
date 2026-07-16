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

def confirm_write_action(
    action_name: str,
    data: dict[str, Any],
) -> bool:
    """
    所有会修改外部状态的操作都经过统一确认。
    """

    print(f"\n检测到写操作：{action_name}")
    print(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        )
    )

    answer = input(
        "是否确认执行？请输入 y 或 n："
    ).strip().lower()

    return answer in {"y", "yes"}


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

    仅在用户明确要求创建、添加或安排任务时使用。

    参数要求：
    - title：只填写学习内容，不要包含“今晚”“明天”等时间表达。
    - due_date：填写任务时间，例如“今晚”“明天下午”或具体日期。
    """

    print("\n检测到写操作，需要用户确认：")
    print(
        json.dumps(
            {
                "title": title,
                "due_date": due_date,
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    answer = input(
        "是否确认执行？请输入 y 或 n："
    ).strip().lower()

    if answer not in {"y", "yes"}:
        return {
            "success": False,
            "cancelled": True,
            "message": "用户取消了操作。",
        }

    task = {
        "id": len(TASKS) + 1,
        "title": title,
        "dueDate": due_date,
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

    仅当用户明确要求忘记、删除或清除个人资料时使用。
    """

    confirmed = confirm_write_action(
        "删除长期用户资料",
        {
            "userId": CURRENT_USER_ID,
        },
    )

    if not confirmed:
        return {
            "success": False,
            "cancelled": True,
            "message": "用户取消了长期资料删除。",
        }

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
7. 工具被取消后，不要再次调用同一个工具。
8. 使用简洁、自然的中文回答。



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
    checkpointer=checkpointer,
)

# ============================================================
# 7. 执行 Agent
# ============================================================

def run_agent(
    user_input: str,
    thread_id: str,
) -> None:
    """
    流式执行 Agent：
    - 模型文本实时输出
    - 工具调用和结果实时显示
    """

    config = {
    "configurable": {
        "thread_id": thread_id,
    }
}

    stream = agent.stream_events(
        {
            "messages": [
                {
                    "role": "user",
                    "content": user_input,
                }
            ]
        },
        config,
        version="v3",
    )

    is_printing_model_text = False

    for kind, item in stream.interleave(
        "messages",
        "tool_calls",
    ):
        # 模型文本流
        if kind == "messages":
            for text_chunk in item.text:
                if not is_printing_model_text:
                    print(
                        "\nAgent：",
                        end="",
                        flush=True,
                    )
                    is_printing_model_text = True

                print(
                    text_chunk,
                    end="",
                    flush=True,
                )

        # 工具调用事件
        elif kind == "tool_calls":
            if is_printing_model_text:
                print()
                is_printing_model_text = False

            print(
                f"\n[调用工具] {item.tool_name}"
            )

            print("[工具参数]")
            print(
                json.dumps(
                    item.input,
                    ensure_ascii=False,
                    indent=2,
                    default=str,
                )
            )

            # 工具自身有流式输出时，这里逐段打印
            for output_delta in item.output_deltas:
                if output_delta:
                    print(
                        output_delta,
                        end="",
                        flush=True,
                    )

            print("\n[工具结果]")

            tool_output = item.output

            if hasattr(tool_output, "content"):
                tool_output = tool_output.content

            if isinstance(tool_output, str):
                try:
                    parsed_output = json.loads(tool_output)

                    print(
                        json.dumps(
                            parsed_output,
                            ensure_ascii=False,
                            indent=2,
                        )
                    )
                except json.JSONDecodeError:
                    print(tool_output)
            else:
                print(tool_output)

                print()

# ============================================================
# 8. 命令行入口
# ============================================================

def main() -> None:
    print("SYNC-STUDY LangChain Agent V2C")
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