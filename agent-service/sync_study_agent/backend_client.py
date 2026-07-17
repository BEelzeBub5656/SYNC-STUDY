"""HTTP client for the authenticated Java Agent-internal API.

The mobile client never calls these endpoints.  The Python Agent service uses
them to read and mutate formal business data after Spring Boot has resolved the
authenticated user id.  This module intentionally contains no model/API-key
configuration and never logs request headers or response bodies.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping
import httpx


class BackendClientError(RuntimeError):
    """Raised when the Java backend cannot complete an internal request."""


@dataclass(frozen=True, slots=True)
class BackendResponse:
    """Small result wrapper used where a missing resource is not an error."""

    data: Any
    found: bool = True


def _unwrap_envelope(payload: Any) -> Any:
    """Accept both plain JSON and the Java ``{code,message,data}`` envelope."""

    if not isinstance(payload, Mapping):
        return payload

    if "data" not in payload:
        return payload

    # An ApiResponse may use either an HTTP-like numeric code or an app-level
    # success value.  HTTP status has already been checked by ``_request``.
    return payload.get("data")


class BackendClient:
    """Synchronous, timeout-bounded client for Agent-only Spring endpoints."""

    def __init__(
        self,
        *,
        base_url: str,
        service_token: str | None = None,
        timeout_seconds: float = 10.0,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        headers = {"Accept": "application/json"}
        if service_token:
            headers["X-Agent-Service-Token"] = service_token

        self._client = httpx.Client(
            base_url=base_url.rstrip("/"),
            headers=headers,
            timeout=timeout_seconds,
            transport=transport,
        )

    @staticmethod
    def _user_path(user_id: int, suffix: str) -> str:
        if user_id <= 0:
            raise ValueError("user_id must be positive")
        return f"/api/internal/agent/users/{user_id}/{suffix.lstrip('/')}"

    def _request(
        self,
        method: str,
        path: str,
        *,
        allow_not_found: bool = False,
        **kwargs: Any,
    ) -> BackendResponse:
        try:
            response = self._client.request(method, path, **kwargs)
        except httpx.HTTPError as exception:
            raise BackendClientError(
                "Java backend is temporarily unavailable."
            ) from exception

        if response.status_code == 404 and allow_not_found:
            return BackendResponse(data=None, found=False)

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exception:
            raise BackendClientError(
                f"Java backend request failed with HTTP {response.status_code}."
            ) from exception

        if response.status_code == 204 or not response.content:
            return BackendResponse(data=None)

        try:
            payload = response.json()
        except ValueError as exception:
            raise BackendClientError(
                "Java backend returned an invalid JSON response."
            ) from exception

        return BackendResponse(data=_unwrap_envelope(payload))

    def list_memories(self, user_id: int) -> list[dict[str, Any]]:
        result = self._request(
            "GET",
            self._user_path(user_id, "memories"),
            allow_not_found=True,
        )
        if not result.found or result.data is None:
            return []
        if isinstance(result.data, list):
            return [item for item in result.data if isinstance(item, dict)]
        return []

    def upsert_memory(
        self,
        user_id: int,
        *,
        category: str,
        memory_key: str,
        value: str,
    ) -> Any:
        return self._request(
            "POST",
            self._user_path(user_id, "memories"),
            json={
                "category": category,
                "memoryKey": memory_key,
                "value": value,
            },
        ).data

    def delete_memory(self, user_id: int, *, memory_id: int) -> bool:
        result = self._request(
            "DELETE",
            self._user_path(user_id, f"memories/{memory_id}"),
            allow_not_found=True,
        )
        return result.found

    def get_latest_exam(self, user_id: int) -> dict[str, Any] | None:
        result = self._request(
            "GET",
            self._user_path(user_id, "exams/latest"),
            allow_not_found=True,
        )
        return result.data if isinstance(result.data, dict) else None

    def get_today_tasks(self, user_id: int) -> list[dict[str, Any]]:
        result = self._request(
            "GET",
            self._user_path(user_id, "today-tasks"),
            allow_not_found=True,
        )
        if not result.found or result.data is None:
            return []
        if isinstance(result.data, list):
            return [item for item in result.data if isinstance(item, dict)]
        return []

    def create_task(
        self,
        user_id: int,
        payload: Mapping[str, Any],
        *,
        idempotency_key: str,
    ) -> Any:
        return self._request(
            "POST",
            self._user_path(user_id, "today-tasks"),
            headers={"Idempotency-Key": idempotency_key},
            json=dict(payload),
        ).data

    def update_task(
        self,
        user_id: int,
        task_id: int,
        payload: Mapping[str, Any],
        *,
        idempotency_key: str,
    ) -> Any:
        return self._request(
            "PATCH",
            self._user_path(user_id, f"today-tasks/{task_id}"),
            headers={"Idempotency-Key": idempotency_key},
            json=dict(payload),
        ).data

    def delete_task(
        self,
        user_id: int,
        task_id: int,
        *,
        idempotency_key: str,
    ) -> bool:
        result = self._request(
            "DELETE",
            self._user_path(user_id, f"today-tasks/{task_id}"),
            headers={"Idempotency-Key": idempotency_key},
            allow_not_found=True,
        )
        return result.found

    def search_knowledge(
        self,
        user_id: int,
        *,
        query: str,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        result = self._request(
            "GET",
            self._user_path(user_id, "knowledge-documents"),
            params={"q": query, "limit": max(1, min(limit, 10))},
            allow_not_found=True,
        )
        if not result.found or result.data is None:
            return []
        if isinstance(result.data, list):
            return [item for item in result.data if isinstance(item, dict)]
        return []

    def close(self) -> None:
        self._client.close()
