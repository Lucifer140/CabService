"""
Health & Readiness Check Controller
Provides liveness (/api/health) and readiness (/api/readiness) probes for
Docker, Kubernetes, load balancers, and monitoring services.
"""

import os
import time
import sqlite3
from datetime import datetime, timezone

from core.config import DB_FILE, UPLOADS_DIR, ENVIRONMENT
from core.response import send_json, send_error

_START_TIME = time.time()

class HealthController:
    @staticmethod
    def get_health(handler):
        """Liveness probe: verifies server process is responsive."""
        uptime_seconds = int(time.time() - _START_TIME)
        return send_json(handler, {
            "status": "healthy",
            "uptime_seconds": uptime_seconds,
            "environment": ENVIRONMENT,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    @staticmethod
    def get_readiness(handler):
        """Readiness probe: verifies SQLite database and upload storage are operational."""
        db_ok = False
        db_err = None
        tables_count = 0

        try:
            with sqlite3.connect(DB_FILE) as conn:
                cur = conn.cursor()
                cur.execute("SELECT count(*) FROM sqlite_master WHERE type='table';")
                tables_count = cur.fetchone()[0]
                db_ok = tables_count > 5
        except Exception as e:
            db_err = str(e)

        uploads_writable = os.path.isdir(UPLOADS_DIR) and os.access(UPLOADS_DIR, os.W_OK)

        is_ready = db_ok and uploads_writable
        payload = {
            "status": "ready" if is_ready else "not_ready",
            "database": {
                "connected": db_ok,
                "tables_count": tables_count,
                "path": DB_FILE,
                "error": db_err
            },
            "storage": {
                "uploads_writable": uploads_writable,
                "uploads_dir": UPLOADS_DIR
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        if is_ready:
            return send_json(handler, payload, status=200)
        else:
            return send_json(handler, payload, status=503)
