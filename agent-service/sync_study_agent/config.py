"""Configuration for the production Agent HTTP service.

This module deliberately does not fail during import.  FastAPI can therefore
start and expose a useful health response even when model credentials have not
yet been configured on a development machine.
"""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path

from dotenv import load_dotenv


SERVICE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATABASE_PATH = SERVICE_ROOT / "data" / "agent_memory.db"


def _optional_text(value: str | None) -> str | None:
    if value is None:
        return None

    clean_value = value.strip()
    return clean_value or None


def _bounded_integer(
    name: str,
    default: int,
    *,
    minimum: int,
    maximum: int,
) -> int:
    raw_value = os.getenv(name)

    if raw_value is None:
        return default

    try:
        parsed_value = int(raw_value)
    except ValueError:
        return default

    return max(minimum, min(parsed_value, maximum))


def _bounded_float(
    name: str,
    default: float,
    *,
    minimum: float,
    maximum: float,
) -> float:
    raw_value = os.getenv(name)

    if raw_value is None:
        return default

    try:
        parsed_value = float(raw_value)
    except ValueError:
        return default

    return max(minimum, min(parsed_value, maximum))


def _database_path(raw_value: str | None) -> Path:
    if raw_value is None or not raw_value.strip():
        return DEFAULT_DATABASE_PATH

    path = Path(raw_value.strip()).expanduser()

    if not path.is_absolute():
        path = SERVICE_ROOT / path

    return path.resolve()


@dataclass(frozen=True, slots=True)
class AgentSettings:
    """Validated settings without ever exposing secret values."""

    api_key: str | None
    base_url: str | None
    model: str | None
    service_token: str | None
    backend_base_url: str = "http://127.0.0.1:8080"
    backend_timeout_seconds: float = 10.0
    database_path: Path = DEFAULT_DATABASE_PATH
    context_messages: int = 16
    request_timeout_seconds: float = 60.0
    max_retries: int = 2

    @classmethod
    def from_environment(
        cls,
        dotenv_path: Path | None = None,
    ) -> AgentSettings:
        """Read configuration from environment and the local ``.env`` file.

        Environment variables already supplied by the process take precedence
        over values in the file.
        """

        load_dotenv(
            dotenv_path=dotenv_path or SERVICE_ROOT / ".env",
            override=False,
        )

        return cls(
            api_key=_optional_text(os.getenv("LONGCAT_API_KEY")),
            base_url=_optional_text(os.getenv("LONGCAT_BASE_URL")),
            model=_optional_text(os.getenv("LONGCAT_MODEL")),
            service_token=_optional_text(
                os.getenv("AGENT_SERVICE_TOKEN")
            ),
            backend_base_url=(
                _optional_text(os.getenv("AGENT_BACKEND_BASE_URL"))
                or "http://127.0.0.1:8080"
            ).rstrip("/"),
            backend_timeout_seconds=_bounded_float(
                "AGENT_BACKEND_TIMEOUT_SECONDS",
                10.0,
                minimum=1.0,
                maximum=60.0,
            ),
            database_path=_database_path(
                os.getenv("AGENT_DATABASE_PATH")
            ),
            context_messages=_bounded_integer(
                "AGENT_CONTEXT_MESSAGES",
                16,
                minimum=2,
                maximum=100,
            ),
            request_timeout_seconds=_bounded_float(
                "AGENT_REQUEST_TIMEOUT_SECONDS",
                60.0,
                minimum=5.0,
                maximum=300.0,
            ),
            max_retries=_bounded_integer(
                "AGENT_MAX_RETRIES",
                2,
                minimum=0,
                maximum=5,
            ),
        )

    @property
    def missing_configuration(self) -> tuple[str, ...]:
        missing: list[str] = []

        if not self.api_key:
            missing.append("LONGCAT_API_KEY")

        if not self.base_url:
            missing.append("LONGCAT_BASE_URL")

        if not self.model:
            missing.append("LONGCAT_MODEL")

        return tuple(missing)

    @property
    def ready(self) -> bool:
        return not self.missing_configuration

    @property
    def health_detail(self) -> str:
        if self.ready:
            return "Agent model configuration is ready."

        missing = ", ".join(self.missing_configuration)
        return f"Missing required configuration: {missing}."

    @property
    def public_model_name(self) -> str:
        return self.model or "not-configured"
