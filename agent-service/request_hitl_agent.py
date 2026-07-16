import json
import uuid
from typing import Any

from langgraph.types import Command

from hitl_agent import MODEL, agent, extract_final_text


def build_config(thread_id: str) -> dict[str, Any]:
    """
    根据 thread_id 创建 LangGraph 运行配置。
    """

    return {
        "configurable": {
            "thread_id": thread_id,
        }
    }


def extract_pending_actions(
    interrupts: tuple[Any, ...],
) -> list[dict[str, Any]]:
    """
    从 LangGraph interrupt 中提取待审批工具。
    """

    actions: list[dict[str, Any]] = []

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
            arguments = action.get("arguments")

            if arguments is None:
                arguments = action.get("args", {})

            allowed_decisions: list[str] = []

            if index < len(review_configs):
                allowed_decisions = review_configs[index].get(
                    "allowed_decisions",
                    [],
                )

            actions.append(
                {
                    "name": action.get("name"),
                    "arguments": arguments,
                    "description": action.get(
                        "description",
                        "",
                    ),
                    "allowedDecisions": allowed_decisions,
                }
            )

    return actions


def convert_result_to_response(
    result: Any,
) -> dict[str, Any]:
    """
    把 LangGraph 执行结果转换成业务层响应。
    """

    if result.interrupts:
        return {
            "status": "confirmation_required",
            "actions": extract_pending_actions(
                result.interrupts
            ),
        }

    return {
        "status": "completed",
        "message": extract_final_text(result),
    }


def start_agent_turn(
    user_input: str,
    thread_id: str,
) -> dict[str, Any]:
    """
    发起一轮新的 Agent 对话。

    可能返回：
    - completed
    - confirmation_required
    """

    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": user_input,
                }
            ]
        },
        config=build_config(thread_id),
        version="v2",
    )

    return convert_result_to_response(result)


def resume_agent_turn(
    thread_id: str,
    decision_type: str,
) -> dict[str, Any]:
    """
    恢复当前 thread_id 中暂停的 Agent。

    当前学习版本一次只审批一个工具调用。
    """

    if decision_type == "approve":
        decision = {
            "type": "approve",
        }

    elif decision_type == "reject":
        decision = {
            "type": "reject",
            "message": (
                "用户拒绝了本次待审批操作。"
                "本轮不要自动重试。"
                "如果用户以后重新发起新的操作请求，"
                "可以重新请求审批。"
            ),
        }

    else:
        raise ValueError(
            "decision_type 只能是 approve 或 reject"
        )

    result = agent.invoke(
        Command(
            resume={
                "decisions": [
                    decision,
                ]
            }
        ),
        config=build_config(thread_id),
        version="v2",
    )

    return convert_result_to_response(result)


def print_agent_response(
    response: dict[str, Any],
) -> None:
    status = response["status"]

    if status == "completed":
        print("\nAgent：")
        print(response["message"])
        return

    if status == "no_pending_confirmation":
        print("\n审批失败：")
        print(response["message"])
        return

    if status == "confirmation_required":
        print("\n================================")
        print("当前请求已结束，等待用户审批")
        print("================================")

        actions = response["actions"]

        for index, action in enumerate(
            actions,
            start=1,
        ):
            print(f"\n待审批操作 {index}")
            print(f"工具：{action['name']}")

            if action["description"]:
                print(
                    f"说明：{action['description']}"
                )

            print("参数：")
            print(
                json.dumps(
                    action["arguments"],
                    ensure_ascii=False,
                    indent=2,
                )
            )

            print(
                "允许的决策："
                f"{action['allowedDecisions']}"
            )

        print("\n输入 /approve 批准")
        print("输入 /reject 拒绝")
        return
    
    if status == "pending_confirmation_exists":
        print("\n无法发送新消息：")
        print(response["message"])

        actions = response.get("actions", [])

        for index, action in enumerate(
            actions,
            start=1,
        ):
            print(f"\n待审批操作 {index}")
            print(f"工具：{action['name']}")
            print("参数：")
            print(
                json.dumps(
                    action["arguments"],
                    ensure_ascii=False,
                    indent=2,
                )
            )

        return

    print(f"未知响应状态：{status}")

def get_pending_interrupts(
    thread_id: str,
) -> tuple[Any, ...]:
    """
    查询当前线程尚未解决的 interrupt。
    """

    snapshot = agent.get_state(
        build_config(thread_id)
    )

    return tuple(snapshot.interrupts)
    
def count_pending_actions(
    interrupts: tuple[Any, ...],
) -> int:
    """
    统计所有 interrupt 中包含的待审批动作数量。
    """

    action_count = 0

    for interrupt_item in interrupts:
        payload = interrupt_item.value

        action_requests = payload.get(
            "action_requests",
            [],
        )

        action_count += len(action_requests)

    return action_count


def start_agent_turn(
    user_input: str,
    thread_id: str,
) -> dict[str, Any]:
    """
    发起新的 Agent 对话。

    当前线程存在待审批操作时，
    禁止发送新消息覆盖或扰乱暂停状态。
    """

    pending_interrupts = get_pending_interrupts(
        thread_id
    )

    if pending_interrupts:
        return {
            "status": "pending_confirmation_exists",
            "message": (
                "当前会话存在等待审批的操作。"
                "请先使用 /approve 或 /reject 处理，"
                "也可以使用 /pending 查看详情。"
            ),
            "actions": extract_pending_actions(
                pending_interrupts
            ),
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
        config=build_config(thread_id),
        version="v2",
    )

    return convert_result_to_response(result)

def get_pending_response(
    thread_id: str,
) -> dict[str, Any]:
    interrupts = get_pending_interrupts(
        thread_id
    )

    if not interrupts:
        return {
            "status": "no_pending_confirmation",
            "message": "当前会话没有等待审批的操作。",
        }

    return {
        "status": "confirmation_required",
        "actions": extract_pending_actions(
            interrupts
        ),
    }

def main() -> None:
    print(
        "SYNC-STUDY LangGraph Agent "
        "V2G - Request HITL"
    )
    print(f"当前模型：{MODEL}")
    print("输入 /new 创建新会话")
    print("输入 /thread 查看当前会话 ID")
    print("输入 /switch <会话ID> 切换会话") 
    print("输入 /pending 查看待审批操作")
    print("输入 /approve 批准当前暂停操作")
    print("输入 /reject 拒绝当前暂停操作")

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

        try:
            if user_input == "/pending":
                response = get_pending_response(
                    thread_id
                )

            elif user_input == "/approve":
                response = resume_agent_turn(
                    thread_id=thread_id,
                    decision_type="approve",
                )

            elif user_input == "/reject":
                response = resume_agent_turn(
                    thread_id=thread_id,
                    decision_type="reject",
                )

            elif not user_input:
                continue

            elif user_input.startswith("/"):
                print("\n未知命令：")
                print(user_input)
                print(
                    "可用命令：/new、/thread、/switch、"
                    "/pending、/approve、/reject、exit"
                )
                continue

            else:
                response = start_agent_turn(
                    user_input=user_input,
                    thread_id=thread_id,
                )

            print_agent_response(response)

        except Exception as exception:
            print("\nAgent 执行失败：")
            print(
                f"{type(exception).__name__}: "
                f"{exception}"
            )


if __name__ == "__main__":
    main()