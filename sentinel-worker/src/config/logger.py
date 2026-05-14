import logging
import json
import os
import sys
from datetime import datetime, timezone  # Fixed: Added timezone


class JsonFormatter(logging.Formatter):
    """
    SERVICE: Sentinel-AI Python Worker Telemetry Engine
    DESCRIPTION: Formats internal runtime trace metrics into structured JSON outputs.
    """

    def format(self, record):
        # Fixed: Replaced datetime.utcnow() with timezone-aware datetime
        current_time = (
            datetime.now(timezone.utc)
            .isoformat(timespec="milliseconds")
            .replace("+00:00", "Z")
        )

        log_payload = {
            "timestamp": current_time,
            "level": record.levelname,
            "message": record.getMessage(),
            "service": "sentinel-worker",
            "module": record.module,
        }

        # Capture exceptional execution contexts natively
        if record.exc_info:
            log_payload["err"] = {
                "message": str(record.exc_info[1]),
                "type": record.exc_info[0].__name__ if record.exc_info[0] else "Error",
            }

        # Append runtime dictionary arguments if injected
        if isinstance(record.args, dict):
            log_payload.update(record.args)

        return json.dumps(log_payload)


def setup_worker_logger():
    root_logger = logging.getLogger("sentinel")

    # Avoid duplicate stream handlers
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter())
        root_logger.addHandler(handler)

        # Production control via environment flag
        env = os.getenv("PYTHON_ENV", "development")
        root_logger.setLevel(logging.INFO if env == "production" else logging.DEBUG)

    return root_logger


# Shared singleton logging instance
logger = setup_worker_logger()
