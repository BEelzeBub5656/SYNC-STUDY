import logging
import uuid
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from request_hitl_agent import (
    MODEL,
    get_pending_response,
    resume_agent_turn,
    start_agent_turn,
)


logger = logging.getLogger(__name__)


app = FastAPI(
    title="SYNC-STUDY Agent Service",
    description="SYNC-STUDY LangGraph Agent HTTP API",
    version="0.1.0",
)


class ChatRequest(BaseModel):
    """
    发起一轮 Agent 对话。

    threadId 为空时，由 Agent 服务创建新会话。
    """

    message: str = Field(
        min_length=1,
        max_length=4000,
    )
    threadId: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
    )


class ConfirmationRequest(BaseModel):
    """
    审批当前会话中等待处理的工具操作。
    """

    threadId: str = Field(
        min_length=1,
        max_length=128,
    )
    decision: Literal[
        "approve",
        "reject",
    ]


class PendingActionResponse(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(
        default_factory=dict
    )
    description: str = ""
    allowedDecisions: list[str] = Field(
        default_factory=list
    )


class AgentResponse(BaseModel):
    status: Literal[
        "completed",
        "confirmation_required",
        "pending_confirmation_exists",
        "no_pending_confirmation",
    ]
    threadId: str
    message: str | None = None
    actions: list[PendingActionResponse] = Field(
        default_factory=list
    )


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    model: str


def build_agent_response(
    thread_id: str,
    result: dict[str, Any],
) -> AgentResponse:
    """
    给底层 Agent 结果补充 threadId，
    并交给 Pydantic 校验响应结构。
    """

    return AgentResponse(
        threadId=thread_id,
        **result,
    )


@app.get(
    "/health",
    response_model=HealthResponse,
)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="sync-study-agent",
        model=MODEL,
    )


@app.post(
    "/api/agent/chat",
    response_model=AgentResponse,
)
def chat(
    request: ChatRequest,
) -> AgentResponse:
    """
    发起一轮 Agent 对话。

    返回状态：
    - completed
    - confirmation_required
    - pending_confirmation_exists
    """

    thread_id = (
        request.threadId
        if request.threadId
        else str(uuid.uuid4())
    )

    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=422,
            detail="message 不能为空。",
        )

    try:
        result = start_agent_turn(
            user_input=message,
            thread_id=thread_id,
        )

        return build_agent_response(
            thread_id=thread_id,
            result=result,
        )

    except Exception as exception:
        logger.exception(
            "Agent chat execution failed. "
            "thread_id=%s",
            thread_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Agent 执行失败。",
        ) from exception


@app.post(
    "/api/agent/confirm",
    response_model=AgentResponse,
)
def confirm(
    request: ConfirmationRequest,
) -> AgentResponse:
    """
    批准或拒绝当前线程中的待审批操作。
    """

    try:
        result = resume_agent_turn(
            thread_id=request.threadId,
            decision_type=request.decision,
        )

        return build_agent_response(
            thread_id=request.threadId,
            result=result,
        )

    except Exception as exception:
        logger.exception(
            "Agent confirmation failed. "
            "thread_id=%s",
            request.threadId,
        )

        raise HTTPException(
            status_code=500,
            detail="Agent 审批恢复失败。",
        ) from exception


@app.get(
    "/api/agent/threads/{thread_id}/pending",
    response_model=AgentResponse,
)
def pending(
    thread_id: str,
) -> AgentResponse:
    """
    查询指定线程当前是否存在待审批操作。
    """

    try:
        result = get_pending_response(
            thread_id=thread_id,
        )

        return build_agent_response(
            thread_id=thread_id,
            result=result,
        )

    except Exception as exception:
        logger.exception(
            "Pending confirmation query failed. "
            "thread_id=%s",
            thread_id,
        )

        raise HTTPException(
            status_code=500,
            detail="待审批状态查询失败。",
        ) from exception