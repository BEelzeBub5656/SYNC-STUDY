import operator
import os
from typing import Annotated, Literal

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field
from typing_extensions import NotRequired, TypedDict


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


Intent = Literal[
    "exam_query",
    "create_task",
    "general_question",
]


class IntentClassification(BaseModel):
    """
    LongCat 必须按照这个结构返回分类结果。
    """

    intent: Intent = Field(
        description=(
            "用户意图，只能是 exam_query、"
            "create_task 或 general_question。"
        ),
    )

    reason: str = Field(
        min_length=1,
        max_length=200,
        description=(
            "一句简短的分类依据，"
            "不要展开复杂推理。"
        ),
    )


class AgentState(TypedDict):
    """
    整张图共享的状态。
    """

    user_input: str

    intent: NotRequired[Intent]

    classification_reason: NotRequired[str]

    response: NotRequired[str]

    route_trace: Annotated[
        list[str],
        operator.add,
    ]


model = ChatOpenAI(
    model=MODEL,
    api_key=API_KEY,
    base_url=BASE_URL,
    temperature=0,
    timeout=60,
    max_retries=2,
)


# 使用 Tool Calling 约束 LongCat 输出。
classification_model = (
    model.with_structured_output(
        IntentClassification,
        method="function_calling",
        include_raw=True,
    )
)


CLASSIFICATION_SYSTEM_PROMPT = """
你是 SYNC-STUDY 的意图分类器。

你的唯一任务是把用户输入分类成以下一种意图：

1. exam_query
用户要查询考试、测验、考试时间、考试安排或最近考试。

示例：
- 我最近有什么考试？
- 下一门考试是什么？
- 软件工程什么时候考试？
- 最近哪门课要测验？

2. create_task
用户明确要求创建、添加、新建、安排或制定一项学习任务。

示例：
- 帮我创建一个复习数据库的任务。
- 安排我明晚复习计算机网络。
- 给计划里加一个英语背诵任务。
- 制定一个今晚复习索引的任务。

3. general_question
不属于上述两类的其他问题。

示例：
- TCP 慢启动是什么？
- 数据库索引有什么作用？
- 我应该怎样复习计算机网络？
- 我今天有什么任务？

分类规则：

- 只有明确要求执行创建动作，才能分类为 create_task。
- 只是讨论任务、询问任务或解释任务，不属于 create_task。
- 只有查询考试安排和考试日期，才属于 exam_query。
- “如何复习考试”属于 general_question，不属于 exam_query。
- 如果一句话既包含查询内容，也明确要求创建任务，
  优先分类为 create_task。
- 不得创建新的意图类型。
- 不要回答用户的问题，只进行分类。
""".strip()


def classify_intent(
    state: AgentState,
) -> dict:
    """
    使用 LongCat 对用户输入进行结构化意图分类。
    """

    result = classification_model.invoke(
        [
            {
                "role": "system",
                "content": (
                    CLASSIFICATION_SYSTEM_PROMPT
                ),
            },
            {
                "role": "user",
                "content": state["user_input"],
            },
        ]
    )

    parsed = result.get("parsed")
    parsing_error = result.get(
        "parsing_error"
    )

    if parsed is None:
        raise RuntimeError(
            "LongCat 意图分类结果解析失败："
            f"{parsing_error}"
        )

    if not isinstance(
        parsed,
        IntentClassification,
    ):
        raise TypeError(
            "LongCat 返回了非预期的分类类型："
            f"{type(parsed).__name__}"
        )

    return {
        "intent": parsed.intent,
        "classification_reason": (
            parsed.reason
        ),
        "route_trace": [
            "classify_intent_with_longcat",
        ],
    }


def answer_exam_query(
    state: AgentState,
) -> dict:
    """
    考试查询分支。
    """

    return {
        "response": (
            "已由 LongCat 识别为考试查询。"
            "未来这里会调用 get_exam_list。"
        ),
        "route_trace": [
            "answer_exam_query",
        ],
    }


def prepare_task_creation(
    state: AgentState,
) -> dict:
    """
    创建学习任务分支。
    """

    return {
        "response": (
            "已由 LongCat 识别为任务创建请求。"
            "未来这里会提取任务参数，"
            "然后进入 HITL 审批。"
        ),
        "route_trace": [
            "prepare_task_creation",
        ],
    }


def answer_general_question(
    state: AgentState,
) -> dict:
    """
    普通问题分支。
    """

    return {
        "response": (
            "已由 LongCat 识别为普通问题。"
            "未来这里会调用回答模型。"
        ),
        "route_trace": [
            "answer_general_question",
        ],
    }


def route_by_intent(
    state: AgentState,
) -> Intent:
    """
    根据已经验证过的 intent 进行确定性路由。
    """

    return state["intent"]


def build_graph():
    """
    构建并编译 StateGraph。
    """

    builder = StateGraph(AgentState)

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

    builder.add_edge(
        START,
        "classify_intent",
    )

    builder.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "exam_query": (
                "answer_exam_query"
            ),
            "create_task": (
                "prepare_task_creation"
            ),
            "general_question": (
                "answer_general_question"
            ),
        },
    )

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
    print(
        "分类依据："
        f"{result['classification_reason']}"
    )
    print(
        f"执行路径：{result['route_trace']}"
    )
    print(f"最终回答：{result['response']}")


def main() -> None:
    print("SYNC-STUDY LangGraph V3B")
    print("LongCat 结构化意图路由")
    print(f"当前模型：{MODEL}")
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