import operator
import os
from typing import Annotated, Any, Literal
import sqlite3
import uuid
import json

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command, interrupt

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

class TaskParameters(BaseModel):
    """
    LongCat 从用户输入中提取的任务参数。

    缺失字段必须返回 None，不得自行猜测。
    """

    title: str | None = Field(
        default=None,
        description=(
            "学习任务标题，只保留学习内容，"
            "不要包含截止时间。"
        ),
    )

    due_date: str | None = Field(
        default=None,
        description=(
            "用户明确提供的截止时间或计划时间。"
            "例如：今晚、明晚、周五、2026-07-20。"
            "没有明确提供时返回 null。"
        ),
    )

class AgentState(TypedDict):
    """
    整张图共享的 State。
    """

    user_input: str

    intent: NotRequired[Intent]

    classification_reason: NotRequired[str]

    task_title: NotRequired[str | None]

    task_due_date: NotRequired[str | None]

    task_validation_error: NotRequired[
        str | None
    ]

    approval_status: NotRequired[
        Literal[
            "approved",
            "rejected",
        ]
    ]

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

task_parameter_model = (
    model.with_structured_output(
        TaskParameters,
        method="function_calling",
        include_raw=True,
    )
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

# 演示用内存任务列表。
# 后续会替换为真实业务接口。
TASKS: list[dict[str, Any]] = []

TASK_EXTRACTION_SYSTEM_PROMPT = """
你是 SYNC-STUDY 的学习任务参数提取器。

你的唯一任务是从用户输入中提取：

1. title
学习任务的具体内容。

2. due_date
用户明确提供的截止时间或安排时间。

规则：

- title 不要包含“今晚”“明晚”“周五”等时间表达。
- due_date 必须来自用户原话。
- 用户没有提供截止时间时，due_date 返回 null。
- 用户没有提供明确学习内容时，title 返回 null。
- 不得自行猜测日期。
- 不得把相对日期转换成具体日期。
- 不要回答用户，只返回结构化结果。

示例：

用户：安排我明晚复习数据库索引
title：复习数据库索引
due_date：明晚

用户：创建一个复习计算机网络的任务
title：复习计算机网络
due_date：null

用户：帮我安排明晚学习
title：null
due_date：明晚
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

def extract_task_parameters(
    state: AgentState,
) -> dict[str, Any]:
    """
    使用 LongCat 提取任务标题和时间。
    """

    result = task_parameter_model.invoke(
        [
            {
                "role": "system",
                "content": (
                    TASK_EXTRACTION_SYSTEM_PROMPT
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
            "任务参数解析失败："
            f"{parsing_error}"
        )

    if not isinstance(
        parsed,
        TaskParameters,
    ):
        raise TypeError(
            "任务参数类型错误："
            f"{type(parsed).__name__}"
        )

    title = (
        parsed.title.strip()
        if parsed.title
        else None
    )

    due_date = (
        parsed.due_date.strip()
        if parsed.due_date
        else None
    )

    return {
        "task_title": title,
        "task_due_date": due_date,
        "route_trace": [
            "extract_task_parameters",
        ],
    }

def validate_task_parameters(
    state: AgentState,
) -> dict[str, Any]:
    """
    使用普通 Python 校验任务参数。

    是否允许进入写操作审批，
    不由模型自行决定。
    """

    missing_fields: list[str] = []

    if not state.get("task_title"):
        missing_fields.append("学习内容")

    if not state.get("task_due_date"):
        missing_fields.append("任务时间")

    if missing_fields:
        missing_text = "、".join(
            missing_fields
        )

        error_message = (
            f"创建任务还缺少：{missing_text}。"
        )

        return {
            "task_validation_error": (
                error_message
            ),
            "response": (
                f"{error_message}"
                "请补充完整后重新创建任务。"
            ),
            "route_trace": [
                "validate_task_parameters_failed",
            ],
        }

    return {
        "task_validation_error": None,
        "route_trace": [
            "validate_task_parameters_passed",
        ],
    }

def route_after_task_validation(
    state: AgentState,
) -> Literal[
    "approval",
    "clarification",
]:
    """
    信息完整才允许进入审批节点。
    """

    if state.get(
        "task_validation_error"
    ):
        return "clarification"

    return "approval"

def review_task_creation(
    state: AgentState,
) -> Command[
    Literal[
        "execute_task_creation",
        "cancel_task_creation",
    ]
]:
    """
    暂停图执行，等待外部批准或拒绝。

    此节点在 interrupt 前不能执行写操作。
    """

    decision = interrupt(
        {
            "type": (
                "task_creation_approval"
            ),
            "question": (
                "是否批准创建这项学习任务？"
            ),
            "task": {
                "title": state.get(
                    "task_title"
                ),
                "dueDate": state.get(
                    "task_due_date"
                ),
            },
            "allowedDecisions": [
                "approve",
                "reject",
            ],
        }
    )

    if not isinstance(decision, dict):
        raise ValueError(
            "审批结果必须是字典。"
        )

    decision_type = decision.get(
        "decision"
    )

    if decision_type == "approve":
        return Command(
            update={
                "approval_status": (
                    "approved"
                ),
                "route_trace": [
                    "review_task_creation_approved",
                ],
            },
            goto="execute_task_creation",
        )

    if decision_type == "reject":
        return Command(
            update={
                "approval_status": (
                    "rejected"
                ),
                "route_trace": [
                    "review_task_creation_rejected",
                ],
            },
            goto="cancel_task_creation",
        )

    raise ValueError(
        "审批 decision 必须是 "
        "approve 或 reject。"
    )

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

memory_connection = sqlite3.connect(
    "state_graph_v3d.db",
    check_same_thread=False,
)

checkpointer = SqliteSaver(
    memory_connection
)

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
    "extract_task_parameters",
    extract_task_parameters,
    )

    builder.add_node(
        "validate_task_parameters",
        validate_task_parameters,
    )

    builder.add_node(
        "review_task_creation",
        review_task_creation,
    )

    builder.add_node(
        "execute_task_creation",
        execute_task_creation,
    )

    builder.add_node(
        "cancel_task_creation",
        cancel_task_creation,
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
                "extract_task_parameters"
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
    "extract_task_parameters",
    "validate_task_parameters",
    )

    builder.add_conditional_edges(
        "validate_task_parameters",
        route_after_task_validation,
        {
            "approval": (
                "review_task_creation"
            ),
            "clarification": END,
        },
    )

    # review_task_creation 使用 Command(goto=...)
    # 动态跳转，因此这里不添加固定出边。

    builder.add_edge(
        "execute_task_creation",
        END,
    )

    builder.add_edge(
        "cancel_task_creation",
        END,
    )

    builder.add_edge(
        "answer_general_question",
        END,
    )

    return builder.compile(
    checkpointer=checkpointer
)


def execute_task_creation(
    state: AgentState,
) -> dict[str, Any]:
    """
    真正执行创建任务。

    当前只写入内存列表。
    后续会替换为真实业务接口。
    """

    title = state.get("task_title")
    due_date = state.get(
        "task_due_date"
    )

    # 执行前再次校验，防止非法状态绕过。
    if not title or not due_date:
        return {
            "tool_result": {
                "success": False,
                "error": (
                    "任务参数不完整，"
                    "拒绝执行写操作。"
                ),
            },
            "response": (
                "任务创建失败："
                "任务参数不完整。"
            ),
            "route_trace": [
                "execute_task_creation_failed",
            ],
        }

    task = {
        "id": len(TASKS) + 1,
        "title": title,
        "dueDate": due_date,
        "completed": False,
    }

    TASKS.append(task)

    return {
        "tool_result": {
            "success": True,
            "task": task,
        },
        "response": (
            "任务创建成功：\n"
            f"- 内容：{title}\n"
            f"- 时间：{due_date}\n"
            "- 状态：待完成"
        ),
        "route_trace": [
            "execute_task_creation",
        ],
    }

def cancel_task_creation(
    state: AgentState,
) -> dict[str, Any]:
    """
    用户拒绝后结束工作流。
    """

    return {
        "tool_result": {
            "success": False,
            "cancelled": True,
        },
        "response": (
            "已取消本次任务创建，"
            "没有写入任何任务。"
        ),
        "route_trace": [
            "cancel_task_creation",
        ],
    }


graph = build_graph()


def build_config(
    thread_id: str,
) -> dict[str, Any]:
    return {
        "configurable": {
            "thread_id": thread_id,
        }
    }


def get_pending_interrupts(
    thread_id: str,
) -> tuple[Any, ...]:
    snapshot = graph.get_state(
        build_config(thread_id)
    )

    return tuple(snapshot.interrupts)


def print_interrupts(
    interrupts: tuple[Any, ...],
) -> None:
    print("\n================================")
    print("图已暂停，等待任务创建审批")
    print("================================")

    for item in interrupts:
        print(
            json.dumps(
                item.value,
                ensure_ascii=False,
                indent=2,
            )
        )

    print("\n输入 /approve 批准")
    print("输入 /reject 拒绝")


def print_result(
    result: dict[str, Any],
) -> None:
    interrupts = tuple(
        result.get(
            "__interrupt__",
            (),
        )
    )

    if interrupts:
        print_interrupts(interrupts)
        return

    print("\n图执行完成")
    print("------------------------------")

    if result.get("intent"):
        print(
            f"识别意图：{result['intent']}"
        )

    if result.get(
        "classification_reason"
    ):
        print(
            "分类依据："
            f"{result['classification_reason']}"
        )

    print(
        "执行路径："
        f"{result.get('route_trace', [])}"
    )

    print("\n最终回答：")
    print(
        result.get(
            "response",
            "图没有生成回答。",
        )
    )


def start_graph_turn(
    user_input: str,
    thread_id: str,
) -> dict[str, Any]:
    return graph.invoke(
        {
            "user_input": user_input,
            "route_trace": [],
        },
        config=build_config(thread_id),
    )


def resume_graph_turn(
    thread_id: str,
    decision: Literal[
        "approve",
        "reject",
    ],
) -> dict[str, Any]:
    pending = get_pending_interrupts(
        thread_id
    )

    if not pending:
        return {
            "response": (
                "当前工作流没有等待审批的操作。"
            ),
            "route_trace": [],
        }

    return graph.invoke(
        Command(
            resume={
                "decision": decision,
            }
        ),
        config=build_config(thread_id),
    )


def main() -> None:
    print("SYNC-STUDY LangGraph V3D")
    print("结构化参数 + 手写 Interrupt")
    print(f"当前模型：{MODEL}")
    print("输入 /thread 查看当前工作流 ID")
    print("输入 /switch <ID> 切换工作流")
    print("输入 /pending 查看待审批操作")
    print("输入 /approve 批准")
    print("输入 /reject 拒绝")
    print("输入 exit 退出")

    thread_id: str | None = None

    while True:
        user_input = input("\n你：").strip()

        if user_input.lower() == "exit":
            print("程序已退出")
            break

        if user_input == "/thread":
            if thread_id:
                print(
                    f"当前工作流：{thread_id}"
                )
            else:
                print("当前还没有工作流。")
            continue

        if user_input.startswith("/switch "):
            new_thread_id = (
                user_input.removeprefix(
                    "/switch "
                ).strip()
            )

            if not new_thread_id:
                print("工作流 ID 不能为空。")
                continue

            thread_id = new_thread_id

            print("已切换工作流：")
            print(thread_id)
            continue

        if user_input == "/pending":
            if not thread_id:
                print("当前还没有工作流。")
                continue

            pending = get_pending_interrupts(
                thread_id
            )

            if not pending:
                print("没有等待审批的操作。")
            else:
                print_interrupts(pending)

            continue

        if user_input in {
            "/approve",
            "/reject",
        }:
            if not thread_id:
                print("当前还没有工作流。")
                continue

            decision = (
                "approve"
                if user_input == "/approve"
                else "reject"
            )

            try:
                result = resume_graph_turn(
                    thread_id=thread_id,
                    decision=decision,
                )

                print_result(result)

            except Exception as exception:
                print("\n恢复执行失败：")
                print(
                    f"{type(exception).__name__}: "
                    f"{exception}"
                )

            continue

        if user_input.startswith("/"):
            print(f"未知命令：{user_input}")
            continue

        if not user_input:
            continue

        # 一个新请求创建一个新的工作流 ID。
        # 审批恢复必须继续使用这个 ID。
        thread_id = str(uuid.uuid4())

        print(
            f"当前工作流：{thread_id}"
        )

        try:
            result = start_graph_turn(
                user_input=user_input,
                thread_id=thread_id,
            )

            print_result(result)

        except Exception as exception:
            print("\n图执行失败：")
            print(
                f"{type(exception).__name__}: "
                f"{exception}"
            )


if __name__ == "__main__":
    main()