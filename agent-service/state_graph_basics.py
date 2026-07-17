import operator
from typing import Annotated, Literal

from langgraph.graph import END, START, StateGraph
from typing_extensions import NotRequired, TypedDict


Intent = Literal[
    "exam_query",
    "create_task",
    "general_question",
]


class AgentState(TypedDict):
    """
    整张图共享的状态结构。
    """

    # 图开始时由用户提供。
    user_input: str

    # 由意图分类节点写入。
    intent: NotRequired[Intent]

    # 由最终处理节点写入。
    response: NotRequired[str]

    # operator.add 表示节点返回的新列表会追加，
    # 而不是覆盖原有列表。
    route_trace: Annotated[
        list[str],
        operator.add,
    ]


def classify_intent(
    state: AgentState,
) -> dict:
    """
    根据关键词判断用户意图。

    当前使用确定性规则。
    后续再替换为 LongCat 结构化分类。
    """

    user_input = state["user_input"].strip()

    task_action_words = (
        "创建",
        "添加",
        "新建",
        "安排",
        "制定",
    )

    is_create_task = (
        "任务" in user_input
        and any(
            word in user_input
            for word in task_action_words
        )
    )

    if is_create_task:
        intent: Intent = "create_task"

    elif "考试" in user_input:
        intent = "exam_query"

    else:
        intent = "general_question"

    return {
        "intent": intent,
        "route_trace": [
            "classify_intent",
        ],
    }


def answer_exam_query(
    state: AgentState,
) -> dict:
    """
    处理考试查询分支。
    """

    return {
        "response": (
            "已识别为考试查询。"
            "未来这里会调用 get_exam_list 工具。"
        ),
        "route_trace": [
            "answer_exam_query",
        ],
    }


def prepare_task_creation(
    state: AgentState,
) -> dict:
    """
    处理创建任务分支。
    """

    return {
        "response": (
            "已识别为创建任务请求。"
            "未来这里会提取任务参数并进入 HITL 审批。"
        ),
        "route_trace": [
            "prepare_task_creation",
        ],
    }


def answer_general_question(
    state: AgentState,
) -> dict:
    """
    处理普通问题分支。
    """

    return {
        "response": (
            "已识别为普通问题。"
            "未来这里会调用 LongCat 生成回答。"
        ),
        "route_trace": [
            "answer_general_question",
        ],
    }


def route_by_intent(
    state: AgentState,
) -> Intent:
    """
    条件边路由函数。

    只负责返回下一条路径，
    不负责生成回答或执行工具。
    """

    return state["intent"]


def build_graph():
    """
    构建并编译 LangGraph。
    """

    builder = StateGraph(AgentState)

    # 注册节点。
    builder.add_node(
        "classify_intent",
        classify_intent,
    )

    builder.add_node(
        "answer_exam_query",
        answer_exam_query,
    )

    builder.add_node(
        "prepare_task_creation",
        prepare_task_creation,
    )

    builder.add_node(
        "answer_general_question",
        answer_general_question,
    )

    # 固定入口。
    builder.add_edge(
        START,
        "classify_intent",
    )

    # 根据意图选择不同分支。
    builder.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "exam_query": "answer_exam_query",
            "create_task": "prepare_task_creation",
            "general_question": (
                "answer_general_question"
            ),
        },
    )

    # 各分支执行完后结束。
    builder.add_edge(
        "answer_exam_query",
        END,
    )

    builder.add_edge(
        "prepare_task_creation",
        END,
    )

    builder.add_edge(
        "answer_general_question",
        END,
    )

    return builder.compile()


graph = build_graph()


def run_graph(
    user_input: str,
) -> None:
    """
    执行一轮图。
    """

    result = graph.invoke(
        {
            "user_input": user_input,
            "route_trace": [],
        }
    )

    print("\n图执行结果")
    print("------------------------------")
    print(f"用户输入：{result['user_input']}")
    print(f"识别意图：{result['intent']}")
    print(f"执行路径：{result['route_trace']}")
    print(f"最终回答：{result['response']}")


def main() -> None:
    print("SYNC-STUDY LangGraph V3A")
    print("手写 StateGraph 意图路由")
    print("输入 exit 退出")

    while True:
        user_input = input("\n你：").strip()

        if user_input.lower() == "exit":
            print("程序已退出")
            break

        if not user_input:
            continue

        try:
            run_graph(user_input)

        except Exception as exception:
            print("\n图执行失败：")
            print(
                f"{type(exception).__name__}: "
                f"{exception}"
            )


if __name__ == "__main__":
    main()