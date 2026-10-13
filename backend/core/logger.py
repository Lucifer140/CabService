"""
Structured Logging & Error Handling Core Module
SANGITA TRAVELS PUNE (PUNE TAXI CAB)
Provides centralized logging with log levels, request correlation IDs (X-Request-ID),
file rotation, and structured JSON/console formatting.
"""

import os
import sys
import time
import json
import uuid
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone

from core.config import BASE_DIR, DATA_DIR, ENVIRONMENT

# Log Directory setup
LOG_DIR = os.path.join(DATA_DIR, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'app.log')

# Determine default log level from ENVIRONMENT or LOG_LEVEL env var
def get_log_level() -> int:
    env_level = os.environ.get('LOG_LEVEL', '').upper()
    if env_level == 'DEBUG':
        return logging.DEBUG
    elif env_level == 'INFO':
        return logging.INFO
    elif env_level == 'WARNING':
        return logging.WARNING
    elif env_level == 'ERROR':
        return logging.ERROR

    # Environment fallbacks:
    if ENVIRONMENT == 'development':
        return logging.DEBUG
    elif ENVIRONMENT == 'staging':
        return logging.INFO
    else:  # production
        return logging.INFO

class StructuredFormatter(logging.Formatter):
    """
    Format logs cleanly for terminal output in development,
    and structured JSON for production/staging ingestion.
    """
    def __init__(self, is_json: bool = False):
        super().__init__()
        self.is_json = is_json

    def format(self, record: logging.LogRecord) -> str:
        # Extract extra fields if present
        req_id = getattr(record, 'request_id', '-')
        extra = getattr(record, 'extra_data', None)

        iso_time = datetime.now(timezone.utc).isoformat()

        if self.is_json:
            log_entry = {
                "timestamp": iso_time,
                "level": record.levelname,
                "logger": record.name,
                "request_id": req_id,
                "message": record.getMessage()
            }
            if extra:
                log_entry["data"] = extra
            if record.exc_info:
                log_entry["exception"] = self.formatException(record.exc_info)
            return json.dumps(log_entry)
        else:
            # Colorized or clean human-readable console format
            level_tag = f"[{record.levelname:<5}]"
            req_tag = f"[{req_id}]" if req_id != '-' else ""
            msg = record.getMessage()
            if extra:
                msg += f" | {json.dumps(extra)}"
            res = f"{iso_time[:19]} {level_tag} {record.name} {req_tag} {msg}"
            if record.exc_info:
                res += "\n" + self.formatException(record.exc_info)
            return res


# Root logger initialization
_root_logger = logging.getLogger("cab_app")
_root_logger.setLevel(get_log_level())
_root_logger.propagate = False

if not _root_logger.handlers:
    # 1. Console Stream Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(get_log_level())
    console_handler.setFormatter(StructuredFormatter(is_json=(ENVIRONMENT == 'production')))
    _root_logger.addHandler(console_handler)

    # 2. Rotating File Handler (5 MB per file, max 5 backups)
    try:
        file_handler = RotatingFileHandler(
            LOG_FILE,
            maxBytes=5 * 1024 * 1024,
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(StructuredFormatter(is_json=True))
        _root_logger.addHandler(file_handler)
    except Exception as e:
        sys.stderr.write(f"Warning: Failed to setup rotating log file: {e}\n")


def get_logger(name: str = "cab_app") -> logging.Logger:
    """Return a child logger under the cab_app hierarchy."""
    if name == "cab_app":
        return _root_logger
    return _root_logger.getChild(name)


def generate_request_id() -> str:
    """Generate a short unique 12-character hexadecimal request correlation ID."""
    return uuid.uuid4().hex[:12]


def log_request(method: str, path: str, status_code: int, duration_ms: float, client_ip: str, request_id: str, extra: dict = None):
    """Log an HTTP request with method, path, response status, duration, and IP."""
    logger = get_logger("http")
    level = logging.INFO
    if status_code >= 500:
        level = logging.ERROR
    elif status_code >= 400:
        level = logging.WARNING

    data = {
        "method": method,
        "path": path,
        "status": status_code,
        "duration_ms": round(duration_ms, 2),
        "ip": client_ip
    }
    if extra:
        data.update(extra)

    record = logger.makeRecord(
        logger.name, level, "(unknown)", 0,
        f"{method} {path} -> {status_code} ({data['duration_ms']}ms) [{client_ip}]",
        (), None
    )
    record.request_id = request_id
    record.extra_data = data
    logger.handle(record)
