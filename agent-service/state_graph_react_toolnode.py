import json
import os
from typing import Any

from dotenv import load_dotenv
from langchain.tools import tool
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_openai import ChatOpenAI
from langgraph.graph import (
    MessagesState,
    START,
    StateGraph,
)
from langgraph.prebuilt import (
    ToolNode,
    tools_condition,
)


load_dotenv()


API_KEY = os.getenv("LONGCAT_API_KEY")
BASE_URL = os.getenv("LONGCAT_BASE_URL")
MODEL = os.getenv(
    "LONGCAT_MODEL",
    "LongCat-2.0",
)


if not API_KEY:
    raise RuntimeError(
        "缺少环境变量 LONGCAT_API_KEY"
    )

if not BASE_URL:
    raise RuntimeError(
        "缺少环境变量 LONGCAT_BASE_URL"
    )


# ============================================================
# 1. 定义只读工具
# ============================================================

@tool
def get_exam_list() -> dict[str, Any]:
    """
    查询当前用户近期的考试安排。

    只读取考试信息，不创建、修改或删除任何数据。
    当用户询问考试、测验、考试时间或下一门考试时使用。
    """

    return {
        "success": True,
        "exams": [
            {
                "course": "计算机网络",
                "examDate": "2026-07-25",
                "location": "教学楼 A201",
            },
            {
                "course": "软件工程",
                "examDate": "2026-07-30",
                "location": "教学楼 B305",
            },
        ],
    }


@tool
def get_today_tasks() -> dict[str, Any]:
    """
    查询当前用户今天的学习任务。

    只读取任务信息，不创建、修改、完成或删除任务。
    当用户询问今天要做什么或今天有哪些任务时使用。
    """

    return {
        "success": True,
        "tasks": [
            {
                "id": 1,
                "title": "复习 TCP 拥塞控制",
                "dueTime": "20:00",
                "completed": False,
            },
            {
                "id": 2,
                "title": "整理软件工程需求分析笔记",
                "dueTime": "21:00",
                "completed": True,
            },
        ],
    }


READ_ONLY_TOOLS = [
    get_exam_list,
    get_today_tasks,
]


# ============================================================
# 2. 创建模型并绑定工具
# ============================================================

model = ChatOpenAI(
    model=MODEL,
    api_key=API_KEY,
    base_url=BASE_URL,
    temperature=0,
    timeout=60,
    max_retries=2,
)


model_with_tools = model.bind_tools(
    READ_ONLY_TOOLS
)


SYSTEM_PROMPT = """
你是 SYNC-STUDY 学习助手。

你当前拥有两个只读工具：

1. get_exam_list
查询用户近期的考试安排。

2. get_today_tasks
查询用户今天的学习任务。

规则：

- 用户询问考试安排、考试日期或下一门考试时，
  必须调用 get_exam_list。
- 用户询问今天有哪些任务或今天要做什么时，
  必须调用 get_today_tasks。
- 用户提出普通知识问题时，直接回答，不要调用无关工具。
- 不得捏造考试、任务或工具执行结果。
- 只有工具返回结果后，才能声称查询到了业务数据。
- 当前没有创建、修改或删除工具。
- 用户要求写操作时，应明确说明当前图只支持只读查询。
- 不得自行猜测当前日期和时间。
- 使用清晰、自然的中文回答。
""".strip()


# ============================================================
# 3. 模型节点
# ============================================================

def call_model(
    state: MessagesState,
) -> dict[str, list[BaseMessage]]:
    """
    调用绑定了工具的 LongCat。

    模型可能返回：
    1. 普通最终回答；
    2. 带有 tool_calls 的 AIMessage。
    """

    response = model_with_tools.invoke(
        [
            SystemMessage(
                content=SYSTEM_PROMPT
            ),
            *state["messages"],
        ]
    )

    return {
        "messages": [
            response,
        ]
    }


# ============================================================
# 4. ToolNode
# ============================================================

tool_node = ToolNode(
    READ_ONLY_TOOLS,

    # 学习阶段将工具异常转换成 ToolMessage，
    # 让模型能够根据错误继续回答。
    handle_tool_errors=True,
)


# ============================================================
# 5. 构建 ReAct 图
# ============================================================

def build_graph():
    builder = StateGraph(
        MessagesState
    )

    builder.add_node(
        "model",
        call_model,
    )

    builder.add_node(
        "tools",
        tool_node,
    )

    # 用户消息进入后先调用模型。
    builder.add_edge(
        START,
        "model",
    )

    # 如果模型产生 tool_calls：
    # model → tools
    #
    # 如果没有 tool_calls：
    # model → END
    builder.add_conditional_edges(
        "model",
        tools_condition,
    )

    # 工具执行结果返回模型。
    # 模型读取 ToolMessage 后决定：
    # - 再调用工具；
    # - 或生成最终回答。
    builder.add_edge(
        "tools",
        "model",
    )

    return builder.compile()


graph = build_graph()


# ============================================================
# 6. 调试输出
# ============================================================

def content_to_text(
    content: Any,
) -> str:
    """
    将不同消息内容统一转换为可显示文本。
    """

    if isinstance(content, str):
        return content

    return json.dumps(
        content,
        ensure_ascii=False,
        indent=2,
        default=str,
    )


def print_execution_trace(
    messages: list[BaseMessage],
) -> None:
    """
    打印完整消息轨迹，观察 ReAct 循环。
    """

    print("\n==============================")
    print("ReAct 执行轨迹")
    print("==============================")

    for index, message in enumerate(
        messages,
        start=1,
    ):
        print(f"\n步骤 {index}")

        if isinstance(
            message,
            HumanMessage,
        ):
            print("类型：HumanMessage")
            print("用户输入：")
            print(
                content_to_text(
                    message.content
                )
            )
            continue

        if isinstance(
            message,
            AIMessage,
        ):
            print("类型：AIMessage")

            if message.tool_calls:
                print("模型决定调用工具：")

                for tool_call in (
                    message.tool_calls
                ):
                    print(
                        json.dumps(
                            {
                                "id": (
                                    tool_call.get(
                                        "id"
                                    )
                                ),
                                "name": (
                                    tool_call.get(
                                        "name"
                                    )
                                ),
                                "args": (
                                    tool_call.get(
                                        "args",
                                        {},
                                    )
                                ),
                            },
                            ensure_ascii=False,
                            indent=2,
                        )
                    )

            else:
                print("模型最终回答：")
                print(
                    content_to_text(
                        message.content
                    )
                )

            continue

        if isinstance(
            message,
            ToolMessage,
        ):
            print("类型：ToolMessage")
            print(
                f"工具名称：{message.name}"
            )
            print(
                "对应调用 ID："
                f"{message.tool_call_id}"
            )
            print("工具返回：")
            print(
                content_to_text(
                    message.content
                )
            )
            continue

        print(
            "其他消息类型："
            f"{type(message).__name__}"
        )
        print(
            content_to_text(
                message.content
            )
        )


def find_final_answer(
    messages: list[BaseMessage],
) -> str:
    """
    从消息列表倒序寻找最终 AI 回答。
    """

    for message in reversed(messages):
        if (
            isinstance(message, AIMessage)
            and not message.tool_calls
        ):
            text = content_to_text(
                message.content
            ).strip()

            if text:
                return text

    return "模型没有生成最终回答。"


# ============================================================
# 7. 执行入口
# ============================================================

def run_agent(
    user_input: str,
) -> None:
    result = graph.invoke(
        {
            "messages": [
                HumanMessage(
                    content=user_input
                )
            ]
        },
        config={
            # 防止模型不断调用工具造成无限循环。
            "recursion_limit": 10,
        },
    )

    messages = result["messages"]

    print_execution_trace(
        messages
    )

    print("\n==============================")
    print("最终展示给用户")
    print("==============================")
    print(
        find_final_answer(messages)
    )


def main() -> None:
    print("SYNC-STUDY LangGraph V3E")
    print("手写 ReAct + ToolNode")
    print(f"当前模型：{MODEL}")
    print("当前只开放只读工具")
    print("输入 exit 退出")

    while True:
        user_input = input(
            "\n你："
        ).strip()

        if user_input.lower() == "exit":
            print("程序已退出")
            break

        if not user_input:
            continue

        try:
            run_agent(
                user_input=user_input
            )

        except Exception as exception:
            print("\nAgent 执行失败：")
            print(
                f"{type(exception).__name__}: "
                f"{exception}"
            )


if __name__ == "__main__":
    main()