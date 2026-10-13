"""
IP-Based Rate Limiting Middleware
Protects sensitive endpoints (login, booking submissions, track events) from brute-force
and denial-of-service abuse using a thread-safe sliding window algorithm.
"""
import time
import threading
from collections import defaultdict

# Thread-safe rate limiter lock
_lock = threading.Lock()

# Map of ip -> list of request timestamps
_request_history = defaultdict(list)

# Route-specific rate limits: (max_requests, window_seconds)
ROUTE_LIMITS = {
    '/api/login': (5, 60),
    '/api/auth/login': (5, 60),
    '/api/auth/forgot-password': (5, 60),
    '/api/auth/reset-password': (5, 60),
    '/api/bookings': (15, 60),
    '/api/public/bookings': (15, 60),
    '/api/track-event': (60, 60),
    '/api/public/track-event': (60, 60),
    '/api/payments/create-order': (10, 60),
    '/api/payments/verify': (10, 60),
    '/api/reviews': (5, 60),
    '/api/public/reviews': (5, 60),
}

DEFAULT_LIMIT = (120, 60)  # 120 reqs/minute for all other routes

class RateLimiter:
    @classmethod
    def is_allowed(cls, ip: str, path: str) -> tuple:
        """
        Checks whether client IP has exceeded the allowed rate for the given path.
        Returns (is_allowed: bool, retry_after_seconds: int).
        """
        now = time.time()
        max_reqs, window = DEFAULT_LIMIT

        for route, limit in ROUTE_LIMITS.items():
            if path == route or path.startswith(f"{route}/"):
                max_reqs, window = limit
                break

        if ip in ('127.0.0.1', 'localhost', '::1'):
            max_reqs = max_reqs * 10


        key = f"{ip}:{path}"
        with _lock:
            # Clean timestamps older than window
            cls._cleanup(now)
            timestamps = _request_history[key]
            valid_timestamps = [ts for ts in timestamps if now - ts < window]

            if len(valid_timestamps) >= max_reqs:
                oldest = valid_timestamps[0]
                retry_after = max(1, int(window - (now - oldest)))
                _request_history[key] = valid_timestamps
                return False, retry_after

            valid_timestamps.append(now)
            _request_history[key] = valid_timestamps
            return True, 0

    @classmethod
    def _cleanup(cls, now: float):
        """Purges expired timestamps across memory store periodically."""
        # Clean periodically every 500 keys
        if len(_request_history) > 500:
            for k in list(_request_history.keys()):
                _request_history[k] = [ts for ts in _request_history[k] if now - ts < 120]
                if not _request_history[k]:
                    del _request_history[k]
