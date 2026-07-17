"""FastAPI entry point for the production SYNC-STUDY Agent service."""

from __future__ import annotations

from contextlib import asynccontextmanager
import hmac
import logging
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from pydantic import BaseModel, Field

from .config import AgentSettings
from .runtime import (
    AgentExecutionError,
    AgentNotReadyError,
    AgentRuntime,
)


logger = logging.getLogger(__name__)


MoodId = Literal["happy", "annoyed", "calm", "tired"]


class ChatRequest(BaseModel):
    userId: int = Field(gt=0)
    message: str = Field(min_length=1, max_length=4000)
    threadId: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
    )


class ChatResponse(BaseModel):
    status: Literal["completed"]
    threadId: str
    message: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    service: str
    model: str
    ready: bool
    detail: str


class MoodAdviceRequest(BaseModel):
    userId: int = Field(gt=0)
    moodId: MoodId
    description: str = Field(default="", max_length=1000)


class MoodAdviceResponse(BaseModel):
    moodId: MoodId
    description: str
    advice: str


def create_app(
    *,
    settings: AgentSettings | None = None,
    runtime: AgentRuntime | None = None,
) -> FastAPI:
    active_settings = settings or AgentSettings.from_environment()
    active_runtime = runtime or AgentRuntime(active_settings)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        yield
        active_runtime.close()

    application = FastAPI(
        title="SYNC-STUDY Agent Service",
        description="LangGraph chat service for the SYNC-STUDY app",
        version="1.0.0",
        lifespan=lifespan,
    )

    def verify_service_token(
        request: Request,
        supplied_token: Annotated[
            str | None,
            Header(alias="X-Agent-Service-Token"),
        ] = None,
    ) -> None:
        expected_token = active_settings.service_token

        if expected_token is None:
            client_host = request.client.host if request.client else ""
            if client_host in {"127.0.0.1", "::1", "localhost", "testclient"}:
                return
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Agent service token is required for non-local requests."
                ),
            )

        if supplied_token is None or not hmac.compare_digest(
            supplied_token,
            expected_token,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Agent service token.",
            )

    @application.get(
        "/health",
        response_model=HealthResponse,
    )
    def health() -> HealthResponse:
        ready = active_runtime.ready

        return HealthResponse(
            status="ok" if ready else "degraded",
            service="sync-study-agent",
            model=active_settings.public_model_name,
            ready=ready,
            detail=active_settings.health_detail,
        )

    @application.post(
        "/api/agent/chat",
        response_model=ChatResponse,
        dependencies=[Depends(verify_service_token)],
    )
    def chat(request: ChatRequest) -> ChatResponse:
        try:
            result = active_runtime.chat(
                user_id=request.userId,
                message=request.message,
                thread_id=request.threadId,
            )
        except AgentNotReadyError as exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exception),
            ) from exception
        except AgentExecutionError as exception:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI provider request failed.",
            ) from exception
        except ValueError as exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exception),
            ) from exception
        except Exception as exception:
            logger.exception("Unexpected Agent chat failure.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Agent execution failed.",
            ) from exception

        return ChatResponse(
            status="completed",
            threadId=result.thread_id,
            message=result.message,
        )

    @application.post(
        "/api/agent/mood-advice",
        response_model=MoodAdviceResponse,
        dependencies=[Depends(verify_service_token)],
    )
    def mood_advice(request: MoodAdviceRequest) -> MoodAdviceResponse:
        try:
            advice = active_runtime.mood_advice(
                user_id=request.userId,
                mood_id=request.moodId,
                description=request.description,
            )
        except AgentNotReadyError as exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exception),
            ) from exception
        except AgentExecutionError as exception:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI provider request failed.",
            ) from exception
        except Exception as exception:
            logger.exception("Unexpected mood-advice failure.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Mood advice generation failed.",
            ) from exception
        return MoodAdviceResponse(
            moodId=request.moodId,
            description=request.description,
            advice=advice,
        )

    return application


app = create_app()
