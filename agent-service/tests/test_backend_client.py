from __future__ import annotations

import json
import unittest

import httpx

from sync_study_agent.backend_client import BackendClient


class BackendClientContractTests(unittest.TestCase):
    def test_exact_java_paths_methods_envelope_and_token(self):
        requests: list[httpx.Request] = []

        def handler(request: httpx.Request) -> httpx.Response:
            requests.append(request)
            path = request.url.path
            if path.endswith("/exams/latest"):
                return httpx.Response(404, json={"message": "not found"})
            if request.method == "GET" and path.endswith("/memories"):
                return httpx.Response(
                    200,
                    json={"code": 0, "message": "success", "data": []},
                )
            if request.method == "GET" and path.endswith("/today-tasks"):
                return httpx.Response(200, json={"code": 0, "data": []})
            if request.method == "GET" and path.endswith("/knowledge-documents"):
                return httpx.Response(200, json={"code": 0, "data": []})
            return httpx.Response(
                200,
                json={"code": 0, "message": "success", "data": {"ok": True}},
            )

        client = BackendClient(
            base_url="http://java.test",
            service_token="shared-secret",
            transport=httpx.MockTransport(handler),
        )
        self.assertEqual(client.list_memories(5), [])
        client.upsert_memory(
            5, category="PROFILE", memory_key="name", value="小林"
        )
        client.delete_memory(5, memory_id=12)
        self.assertIsNone(client.get_latest_exam(5))
        self.assertEqual(client.get_today_tasks(5), [])
        client.create_task(
            5,
            {"title": "复习", "estimatedMinutes": 20, "source": "AGENT"},
            idempotency_key="create-key",
        )
        client.update_task(
            5, 9, {"completed": True}, idempotency_key="update-key"
        )
        client.delete_task(5, 9, idempotency_key="delete-key")
        self.assertEqual(client.search_knowledge(5, query="闭包", limit=4), [])
        client.close()

        signatures = [(request.method, request.url.path) for request in requests]
        self.assertEqual(
            signatures,
            [
                ("GET", "/api/internal/agent/users/5/memories"),
                ("POST", "/api/internal/agent/users/5/memories"),
                ("DELETE", "/api/internal/agent/users/5/memories/12"),
                ("GET", "/api/internal/agent/users/5/exams/latest"),
                ("GET", "/api/internal/agent/users/5/today-tasks"),
                ("POST", "/api/internal/agent/users/5/today-tasks"),
                ("PATCH", "/api/internal/agent/users/5/today-tasks/9"),
                ("DELETE", "/api/internal/agent/users/5/today-tasks/9"),
                ("GET", "/api/internal/agent/users/5/knowledge-documents"),
            ],
        )
        self.assertTrue(
            all(
                request.headers.get("X-Agent-Service-Token") == "shared-secret"
                for request in requests
            )
        )
        upsert_body = json.loads(requests[1].content)
        self.assertEqual(
            upsert_body,
            {"category": "PROFILE", "memoryKey": "name", "value": "小林"},
        )
        self.assertEqual(requests[5].headers["Idempotency-Key"], "create-key")
        self.assertEqual(requests[6].method, "PATCH")
        self.assertEqual(requests[-1].url.params["q"], "闭包")
        self.assertEqual(requests[-1].url.params["limit"], "4")


if __name__ == "__main__":
    unittest.main()

