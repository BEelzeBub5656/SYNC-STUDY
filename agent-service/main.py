import json
import os
import uuid
import sqlite3

from langgraph.checkpoint.sqlite import SqliteSaver

from collections.abc import Callable
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI


# ============================================================
# 1. 加载配置
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


client = OpenAI(
    api_key=API_KEY,
    base_url=BASE_URL,
)


# ============================================================
# 2. 模拟业务数据
# ============================================================

TASKS: list[dict[str, Any]] = []


# ============================================================
# 3. Agent 可以使用的真实 Python 工具
# ============================================================

def get_exam_list() -> dict[str, Any]:
    """查询当前用户的考试列表。"""

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


def create_study_task(
    title: str,
    due_date: str,
) -> dict[str, Any]:
    """创建一项学习任务。"""

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


# ============================================================
# 4. 工具注册表
# ============================================================

ToolFunction = Callable[..., dict[str, Any]]

TOOL_FUNCTIONS: dict[str, ToolFunction] = {
    "get_exam_list": get_exam_list,
    "create_study_task": create_study_task,
}


# ============================================================
# 5. 提供给 LongCat 的工具说明
# ============================================================

TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_exam_list",
            "description": (
                "查询当前用户的考试列表。"
                "当用户询问考试科目、考试日期、最近考试时使用。"
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_study_task",
            "description": (
                "创建一项学习任务。"
                "仅在用户明确要求创建、添加或安排任务时使用。"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "清晰具体的学习任务标题。",
                    },
                    "due_date": {
                        "type": "string",
                        "description": (
                            "任务截止时间，可以是明确日期，"
                            "也可以保留今晚、明天下午等用户表达。"
                        ),
                    },
                },
                "required": [
                    "title",
                    "due_date",
                ],
                "additionalProperties": False,
            },
        },
    },
]


# ============================================================
# 6. Harness 权限配置
# ============================================================

READ_ONLY_TOOLS = {
    "get_exam_list",
}

WRITE_TOOLS = {
    "create_study_task",
}


SYSTEM_PROMPT = """
你是 SYNC-STUDY 学习助手。

你的职责：
1. 回答学习相关问题。
2. 用户询问考试安排时，调用 get_exam_list。
3. 用户明确要求创建学习任务时，调用 create_study_task。
4. 不得捏造考试、任务或工具执行结果。
5. 只有工具返回 success=true 后，才能声称操作成功。
6. 工具返回 cancelled=true 时，应告知用户操作已取消，不要再次调用。
7. 使用简洁、自然的中文回答。
8. 不得自行猜测当前日期和时间。
9. 如果系统没有提供日期工具或明确日期上下文，不要声称“今天是某年某月某日”。

对于写操作：
外部 Harness 会负责请求用户确认。
你只需要提出工具调用，不要在调用前自行重复询问确认。
"""


# ============================================================
# 7. 工具执行器
# ============================================================

def execute_tool(
    tool_name: str,
    arguments: dict[str, Any],
) -> dict[str, Any]:
    """
    根据模型给出的工具名称，调用真正的 Python 函数。
    """

    tool = TOOL_FUNCTIONS.get(tool_name)

    if tool is None:
        return {
            "success": False,
            "error": f"不存在的工具：{tool_name}",
        }

    try:
        return tool(**arguments)

    except TypeError as exception:
        return {
            "success": False,
            "error": f"工具参数错误：{exception}",
        }

    except Exception as exception:
        return {
            "success": False,
            "error": f"工具执行失败：{exception}",
        }


def request_confirmation(
    tool_name: str,
    arguments: dict[str, Any],
) -> bool:
    """
    对修改数据的工具请求人工确认。
    """

    print("\n检测到写操作，需要用户确认：")
    print(f"工具名称：{tool_name}")
    print("工具参数：")
    print(
        json.dumps(
            arguments,
            ensure_ascii=False,
            indent=2,
        )
    )

    answer = input(
        "是否确认执行？请输入 y 或 n："
    ).strip().lower()

    return answer in {"y", "yes"}


# ============================================================
# 8. Agent Loop
# ============================================================

def run_agent(user_input: str) -> str:
    """
    执行一次完整的 LongCat Agent 循环。
    """

    messages: list[dict[str, Any]] = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": user_input,
        },
    ]

    max_steps = 6

    for step in range(1, max_steps + 1):
        print(f"\n--- Agent 第 {step} 步 ---")

        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=TOOL_SCHEMAS,
            tool_choice="auto",
        )

        choice = response.choices[0]
        message = choice.message
        tool_calls = message.tool_calls or []

        print(f"结束原因：{choice.finish_reason}")

        if message.content:
            print("模型本轮文本：")
            print(message.content)

        # 没有工具调用，说明这是最终回答
        if not tool_calls:
            if message.content:
                return message.content

            return "模型没有返回可显示内容。"

        # 把模型本轮工具调用加入消息历史
        assistant_message = {
            "role": "assistant",
            "content": message.content or "",
            "tool_calls": [
                {
                    "id": tool_call.id,
                    "type": "function",
                    "function": {
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments,
                    },
                }
                for tool_call in tool_calls
            ],
        }

        messages.append(assistant_message)

        # 一轮可能包含多个工具调用
        for tool_call in tool_calls:
            tool_name = tool_call.function.name

            try:
                arguments = json.loads(
                    tool_call.function.arguments
                )
            except json.JSONDecodeError as exception:
                result = {
                    "success": False,
                    "error": f"工具参数不是合法 JSON：{exception}",
                }
            else:
                print("\n模型请求调用工具：")
                print(f"名称：{tool_name}")
                print("参数：")
                print(
                    json.dumps(
                        arguments,
                        ensure_ascii=False,
                        indent=2,
                    )
                )

                # 只读工具可以自动执行
                if tool_name in READ_ONLY_TOOLS:
                    result = execute_tool(
                        tool_name,
                        arguments,
                    )

                # 写工具必须确认
                elif tool_name in WRITE_TOOLS:
                    confirmed = request_confirmation(
                        tool_name,
                        arguments,
                    )

                    if confirmed:
                        result = execute_tool(
                            tool_name,
                            arguments,
                        )
                    else:
                        result = {
                            "success": False,
                            "cancelled": True,
                            "message": "用户取消了操作。",
                        }

                # 未授权工具禁止执行
                else:
                    result = {
                        "success": False,
                        "error": (
                            f"工具 {tool_name} "
                            "未配置执行权限。"
                        ),
                    }

            print("工具执行结果：")
            print(
                json.dumps(
                    result,
                    ensure_ascii=False,
                    indent=2,
                )
            )

            # 工具结果必须通过 tool_call_id
            # 与原来的工具调用一一对应
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(
                        result,
                        ensure_ascii=False,
                    ),
                }
            )

    return "Agent 执行步骤超过限制，Harness 已终止运行。"


# ============================================================
# 9. 命令行入口
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