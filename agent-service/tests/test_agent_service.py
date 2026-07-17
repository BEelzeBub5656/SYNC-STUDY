from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage, HumanMessage

from sync_study_agent.api import create_app
from sync_study_agent.config import AgentSettings
from sync_study_agent.runtime import AgentRuntime


class RecordingModel:
    def __init__(self) -> None:
        self.calls: list[list[object]] = []

    def invoke(self, messages: list[object]) -> AIMessage:
        self.calls.append(list(messages))
        human_messages = [
            message.content
            for message in messages
            if isinstance(message, HumanMessage)
        ]
        return AIMessage(content=f"收到：{human_messages[-1]}")


def configured_settings(
    database_path: Path,
    *,
    service_token: str | None = None,
    context_messages: int = 3,
) -> AgentSettings:
    return AgentSettings(
        api_key="test-key",
        base_url="https://example.invalid/v1",
        model="test-model",
        service_token=service_token,
        database_path=database_path,
        context_messages=context_messages,
        request_timeout_seconds=5,
        max_retries=0,
    )


class AgentServiceTests(unittest.TestCase):
    def test_missing_configuration_keeps_service_running(self) -> None:
        with TemporaryDirectory() as directory:
            settings = AgentSettings(
                api_key=None,
                base_url=None,
                model=None,
                service_token=None,
                database_path=Path(directory) / "memory.db",
            )
            app = create_app(settings=settings)

            with TestClient(app) as client:
                health = client.get("/health")
                chat = client.post(
                    "/api/agent/chat",
                    json={
                        "userId": 1,
                        "message": "你好",
                    },
                )

            self.assertEqual(health.status_code, 200)
            self.assertFalse(health.json()["ready"])
            self.assertEqual(health.json()["status"], "degraded")
            self.assertEqual(chat.status_code, 503)

    def test_chat_contract_context_limit_and_user_isolation(self) -> None:
        with TemporaryDirectory() as directory:
            database_path = Path(directory) / "memory.db"
            settings = configured_settings(database_path)
            model = RecordingModel()
            runtime = AgentRuntime(settings, model=model)
            app = create_app(settings=settings, runtime=runtime)

            with TestClient(app) as client:
                first = client.post(
                    "/api/agent/chat",
                    json={
                        "userId": 7,
                        "message": "第一问",
                        "threadId": "shared-id",
                    },
                )
                second = client.post(
                    "/api/agent/chat",
                    json={
                        "userId": 7,
                        "message": "第二问",
                        "threadId": "shared-id",
                    },
                )
                third = client.post(
                    "/api/agent/chat",
                    json={
                        "userId": 7,
                        "message": "第三问",
                        "threadId": "shared-id",
                    },
                )
                isolated = client.post(
                    "/api/agent/chat",
                    json={
                        "userId": 8,
                        "message": "另一个用户",
                        "threadId": "shared-id",
                    },
                )

            self.assertEqual(first.status_code, 200)
            self.assertEqual(second.status_code, 200)
            self.assertEqual(third.status_code, 200)
            self.assertEqual(isolated.status_code, 200)
            self.assertEqual(
                third.json(),
                {
                    "status": "completed",
                    "threadId": "shared-id",
                    "message": "收到：第三问",
                },
            )

            third_prompt = model.calls[2]
            third_human_text = [
                message.content
                for message in third_prompt
                if isinstance(message, HumanMessage)
            ]
            isolated_human_text = [
                message.content
                for message in model.calls[3]
                if isinstance(message, HumanMessage)
            ]

            self.assertEqual(
                third_human_text,
                ["第二问", "第三问"],
            )
            self.assertEqual(
                isolated_human_text,
                ["另一个用户"],
            )

    def test_sqlite_memory_survives_runtime_restart(self) -> None:
        with TemporaryDirectory() as directory:
            database_path = Path(directory) / "memory.db"
            settings = configured_settings(
                database_path,
                context_messages=10,
            )
            first_model = RecordingModel()
            first_runtime = AgentRuntime(
                settings,
                model=first_model,
            )
            first_runtime.chat(
                user_id=3,
                message="记住这句话",
                thread_id="durable",
            )
            first_runtime.close()

            second_model = RecordingModel()
            second_runtime = AgentRuntime(
                settings,
                model=second_model,
            )
            second_runtime.chat(
                user_id=3,
                message="继续对话",
                thread_id="durable",
            )
            second_runtime.close()

            restored_human_text = [
                message.content
                for message in second_model.calls[0]
                if isinstance(message, HumanMessage)
            ]
            self.assertEqual(
                restored_human_text,
                ["记住这句话", "继续对话"],
            )

    def test_optional_service_token_protects_chat_only(self) -> None:
        with TemporaryDirectory() as directory:
            settings = configured_settings(
                Path(directory) / "memory.db",
                service_token="server-secret",
            )
            runtime = AgentRuntime(
                settings,
                model=RecordingModel(),
            )
            app = create_app(settings=settings, runtime=runtime)

            with TestClient(app) as client:
                health = client.get("/health")
                missing = client.post(
                    "/api/agent/chat",
                    json={"userId": 1, "message": "你好"},
                )
                wrong = client.post(
                    "/api/agent/chat",
                    headers={
                        "X-Agent-Service-Token": "wrong-secret"
                    },
                    json={"userId": 1, "message": "你好"},
                )
                accepted = client.post(
                    "/api/agent/chat",
                    headers={
                        "X-Agent-Service-Token": "server-secret"
                    },
                    json={"userId": 1, "message": "你好"},
                )

            self.assertEqual(health.status_code, 200)
            self.assertEqual(missing.status_code, 401)
            self.assertEqual(wrong.status_code, 401)
            self.assertEqual(accepted.status_code, 200)

    def test_without_service_token_non_local_clients_cannot_spoof_user_id(self) -> None:
        with TemporaryDirectory() as directory:
            settings = configured_settings(Path(directory) / "memory.db")
            runtime = AgentRuntime(settings, model=RecordingModel())
            app = create_app(settings=settings, runtime=runtime)

            with TestClient(app, client=("192.168.1.77", 50000)) as client:
                health = client.get("/health")
                rejected = client.post(
                    "/api/agent/chat",
                    json={"userId": 999, "message": "你好"},
                )

            self.assertEqual(health.status_code, 200)
            self.assertEqual(rejected.status_code, 403)


if __name__ == "__main__":
    unittest.main()
