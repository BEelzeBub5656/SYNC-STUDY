import operator
import os
from typing import Annotated, Any, Literal

from dotenv import load_dotenv
from langchain.tools import tool
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
    LongCat 意图分类的结构化输出。
    """

    intent: Intent = Field(
        description=(
            "只能是 exam_query、create_task "
            "或 general_question。"
        ),
    )

    reason: str = Field(
        min_length=1,
        max_length=200,
        description="简短说明分类依据。",
    )


class AgentState(TypedDict):
    """
    整张图共享的 State。
    """

    user_input: str

    intent: NotRequired[Intent]

    classification_reason: NotRequired[str]

    # 确定性工具执行结果。
    tool_result: NotRequired[dict[str, Any]]

    # 最终展示给用户的回答。
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


classification_model = model.with_structured_output(
    IntentClassification,
    method="function_calling",
    include_raw=True,
)


CLASSIFICATION_SYSTEM_PROMPT = """
你是 SYNC-STUDY 的意图分类器。

你的唯一任务是把用户输入分类成以下一种意图：

1. exam_query
用户要查询考试、测验、考试时间、考试日期、
下一门考试或近期考试安排。

示例：
- 我最近有什么考试？
- 下一门要考什么？
- 软件工程什么时候考试？
- 最近哪门课要测验？

2. create_task
用户明确要求系统创建、添加、新建、安排或制定
一项学习任务。

示例：
- 帮我创建一个复习数据库的任务。
- 安排我明晚复习计算机网络。
- 给计划里添加一项英语背诵任务。

3. general_question
不属于上述两类的其他问题。

示例：
- TCP 慢启动是什么？
- 数据库索引有什么作用？
- 计算机网络考试应该怎么复习？
- 我应该怎样安排复习时间？

分类规则：

- 只有明确要求执行创建动作，才能分类为 create_task。
- 只是询问、讨论或解释任务，不属于 create_task。
- 只有查询考试安排或考试日期，才属于 exam_query。
- 询问“考试应该怎样复习”属于 general_question。
- 如果一句话既查询内容又明确要求创建任务，
  优先分类为 create_task。
- 不得创建新的意图类型。
- 不要回答用户的问题，只进行分类。
""".strip()


GENERAL_ANSWER_SYSTEM_PROMPT = """
你是 SYNC-STUDY 学习助手。

请回答用户提出的普通学习问题。

规则：

1. 使用清晰、准确的中文。
2. 可以解释知识点和提供学习建议。
3. 当前节点没有访问考试、任务或用户数据库的权限。
4. 不得声称已经查询考试、创建任务或修改数据。
5. 不得自行猜测当前日期和时间。
6. 回答尽量结构清楚，但不要无故写得过长。
""".strip()


@tool
def get_exam_list() -> dict[str, Any]:
    """
    查询当前用户近期的考试安排。

    当前 V3C 使用演示数据。
    未来会替换为 Spring Boot 业务接口。
    """

    return {
        "success": True,
        "source": "demo",
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


def classify_intent(
    state: AgentState,
) -> dict[str, Any]:
    """
    使用 LongCat 进行结构化意图分类。
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
            "LongCat 意图分类解析失败："
            f"{parsing_error}"
        )

    if not isinstance(
        parsed,
        IntentClassification,
    ):
        raise TypeError(
            "分类结果类型错误："
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


def query_exam_tool(
    state: AgentState,
) -> dict[str, Any]:
    """
    确定性执行考试查询工具。

    只有 exam_query 路由才能进入这个节点，
    不由模型自由决定是否调用。
    """

    result = get_exam_list.invoke({})

    if not isinstance(result, dict):
        raise TypeError(
            "get_exam_list 必须返回字典。"
        )

    return {
        "tool_result": result,
        "route_trace": [
            "query_exam_tool",
        ],
    }


def format_exam_answer(
    state: AgentState,
) -> dict[str, Any]:
    """
    使用确定性 Python 代码格式化考试数据。

    当前不使用 LLM，避免模型改写或捏造考试信息。
    """

    tool_result = state.get("tool_result")

    if not tool_result:
        return {
            "response": "没有取得考试查询结果。",
            "route_trace": [
                "format_exam_answer",
            ],
        }

    if not tool_result.get("success"):
        return {
            "response": "考试信息查询失败。",
            "route_trace": [
                "format_exam_answer",
            ],
        }

    exams = tool_result.get("exams", [])

    if not exams:
        return {
            "response": "近期没有查询到考试安排。",
            "route_trace": [
                "format_exam_answer",
            ],
        }

    lines = [
        "你近期有以下考试安排：",
    ]

    for index, exam in enumerate(
        exams,
        start=1,
    ):
        course = exam.get(
            "course",
            "未知课程",
        )

        exam_date = exam.get(
            "examDate",
            "日期未确定",
        )

        location = exam.get(
            "location",
            "地点未确定",
        )

        lines.append(
            f"{index}. {course}"
            f"｜日期：{exam_date}"
            f"｜地点：{location}"
        )

    return {
        "response": "\n".join(lines),
        "route_trace": [
            "format_exam_answer",
        ],
    }


def prepare_task_creation(
    state: AgentState,
) -> dict[str, Any]:
    """
    创建任务分支的临时占位节点。
    """

    return {
        "response": (
            "已识别为学习任务创建请求。"
            "下一课会提取任务标题和截止时间，"
            "然后进入 HITL 审批。"
        ),
        "route_trace": [
            "prepare_task_creation",
        ],
    }


def answer_general_question(
    state: AgentState,
) -> dict[str, Any]:
    """
    调用 LongCat 回答普通学习问题。
    """

    ai_message = model.invoke(
        [
            {
                "role": "system",
                "content": (
                    GENERAL_ANSWER_SYSTEM_PROMPT
                ),
            },
            {
                "role": "user",
                "content": state["user_input"],
            },
        ]
    )

    content = ai_message.content

    if isinstance(content, str):
        response_text = content.strip()

    else:
        response_text = str(content).strip()

    if not response_text:
        response_text = "模型没有生成有效回答。"

    return {
        "response": response_text,
        "route_trace": [
            "answer_general_question_with_longcat",
        ],
    }


def route_by_intent(
    state: AgentState,
) -> Intent:
    """
    根据已经验证过的业务意图进行路由。
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
        "query_exam_tool",
        query_exam_tool,
    )

    builder.add_node(
        "format_exam_answer",
        format_exam_answer,
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
                "query_exam_tool"
            ),
            "create_task": (
                "prepare_task_creation"
            ),
            "general_question": (
                "answer_general_question"
            ),
        },
    )

    # 考试分支包含两个连续节点：
    # 先查询数据，再格式化回答。
    builder.add_edge(
        "query_exam_tool",
        "format_exam_answer",
    )

    builder.add_edge(
        "format_exam_answer",
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
    执行一轮图并展示最终 State。
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

    if "tool_result" in result:
        print(
            "工具数据："
            f"{result['tool_result']}"
        )

    print("\n最终回答：")
    print(result["response"])


def main() -> None:
    print("SYNC-STUDY LangGraph V3C")
    print("LLM 节点 + 确定性工具节点")
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