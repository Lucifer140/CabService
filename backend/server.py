#!/usr/bin/env python3
"""
SANGITA TRAVELS PUNE (PUNE TAXI CAB)
Modular Production Server & API Entrypoint
Layered Architecture: Core, Repositories (Repository Pattern), Controllers, and Router
Includes Structured Logging, Rate Limiting, CSRF Protection, and Security Hardening
"""

import os
import sys
import time
import traceback
from urllib.parse import urlparse
from http.server import SimpleHTTPRequestHandler, HTTPServer

from core.config import PORT, FRONTEND_DIR, DB_FILE, ENVIRONMENT
from core.response import get_client_ip, send_json, send_error, apply_security_headers
from core.logger import get_logger, generate_request_id, log_request
from router import ApiRouter
from middleware.rate_limiter import RateLimiter
from middleware.csrf import CsrfProtection

logger = get_logger("server")

class CabAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        dist_dir = os.path.join(FRONTEND_DIR, 'dist')
        serve_dir = dist_dir if os.path.isdir(dist_dir) else FRONTEND_DIR
        super().__init__(*args, directory=serve_dir, **kwargs)

    def end_headers(self):
        path = getattr(self, 'path', '')
        if path.startswith('/assets/') or path.endswith(('.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.woff2', '.ico')):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        elif path.endswith(('.html', '/')) or path == '/index.html':
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()


    def _setup_request_context(self):
        self.request_id = self.headers.get('X-Request-ID') or generate_request_id()
        self.start_time = time.time()
        self.last_status = 200

    def _finish_request_log(self, method: str, path: str):
        duration_ms = (time.time() - getattr(self, 'start_time', time.time())) * 1000
        status = getattr(self, 'last_status', 200)
        ip = get_client_ip(self)
        req_id = getattr(self, 'request_id', '-')
        log_request(method, path, status, duration_ms, ip, req_id)

    def do_OPTIONS(self):
        self._setup_request_context()
        self.send_response(200)
        apply_security_headers(self)
        self.end_headers()
        self._finish_request_log('OPTIONS', self.path)

    def do_HEAD(self):
        self._setup_request_context()
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith('/admin') or path.startswith('/login') or path in ('/admin.html', '/login.html'):
            self.path = '/index.html'
        elif path == '/favicon.ico':
            self.path = '/favicon.svg'
        res = super().do_HEAD()
        self._finish_request_log('HEAD', path)
        return res

    def do_GET(self):
        self._setup_request_context()
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            # 1. API & Root Dynamic Route Dispatcher
            if path.startswith('/api/') or path in ('/sitemap.xml', '/robots.txt', '/health', '/readiness'):
                ip = get_client_ip(self)
                allowed, retry_after = RateLimiter.is_allowed(ip, path)

                if not allowed:
                    self.last_status = 429
                    return send_json(self, {"success": False, "error": f"Rate limit exceeded. Please wait {retry_after} seconds."}, status=429, extra_headers={"Retry-After": str(retry_after)})
                return ApiRouter.dispatch_get(self, path)

            # 2. Favicon
            if path == '/favicon.ico':
                self.path = '/favicon.svg'
                return super().do_GET()

            # 3. Direct SPA routes (/admin, /login, etc.)
            if path.startswith('/admin') or path.startswith('/login') or path in ('/admin.html', '/login.html'):
                self.path = '/index.html'
                return super().do_GET()

            # 4. Static File with SPA Fallback
            local_path = self.translate_path(self.path)
            if not os.path.exists(local_path) and not path.startswith('/assets/'):
                self.path = '/index.html'

            return super().do_GET()
        except Exception as e:
            logger.error(f"Unhandled GET exception on {path}: {e}\n{traceback.format_exc()}")
            self.last_status = 500
            return send_error(self, "Internal server error occurred.", status=500)
        finally:
            self._finish_request_log('GET', path)

    def do_POST(self):
        self._setup_request_context()
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            if path.startswith('/api/'):
                if not CsrfProtection.validate_request(self, 'POST'):
                    self.last_status = 403
                    return send_error(self, "Cross-Origin request blocked. Origin not permitted.", status=403)
                ip = get_client_ip(self)
                allowed, retry_after = RateLimiter.is_allowed(ip, path)
                if not allowed:
                    self.last_status = 429
                    return send_json(self, {"success": False, "error": f"Rate limit exceeded. Please wait {retry_after} seconds."}, status=429, extra_headers={"Retry-After": str(retry_after)})
                return ApiRouter.dispatch_post(self, path)
            self.last_status = 404
            self.send_error(404, "Endpoint not found")
        except Exception as e:
            logger.error(f"Unhandled POST exception on {path}: {e}\n{traceback.format_exc()}")
            self.last_status = 500
            return send_error(self, "Internal server error occurred.", status=500)
        finally:
            self._finish_request_log('POST', path)

    def do_PUT(self):
        self._setup_request_context()
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            if path.startswith('/api/'):
                if not CsrfProtection.validate_request(self, 'PUT'):
                    self.last_status = 403
                    return send_error(self, "Cross-Origin request blocked. Origin not permitted.", status=403)
                ip = get_client_ip(self)
                allowed, retry_after = RateLimiter.is_allowed(ip, path)
                if not allowed:
                    self.last_status = 429
                    return send_json(self, {"success": False, "error": f"Rate limit exceeded. Please wait {retry_after} seconds."}, status=429, extra_headers={"Retry-After": str(retry_after)})
                return ApiRouter.dispatch_put(self, path)
            self.last_status = 404
            self.send_error(404, "Endpoint not found")
        except Exception as e:
            logger.error(f"Unhandled PUT exception on {path}: {e}\n{traceback.format_exc()}")
            self.last_status = 500
            return send_error(self, "Internal server error occurred.", status=500)
        finally:
            self._finish_request_log('PUT', path)

    def do_DELETE(self):
        self._setup_request_context()
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            if path.startswith('/api/'):
                if not CsrfProtection.validate_request(self, 'DELETE'):
                    self.last_status = 403
                    return send_error(self, "Cross-Origin request blocked. Origin not permitted.", status=403)
                ip = get_client_ip(self)
                allowed, retry_after = RateLimiter.is_allowed(ip, path)
                if not allowed:
                    self.last_status = 429
                    return send_json(self, {"success": False, "error": f"Rate limit exceeded. Please wait {retry_after} seconds."}, status=429, extra_headers={"Retry-After": str(retry_after)})
                return ApiRouter.dispatch_delete(self, path)
            self.last_status = 404
            self.send_error(404, "Endpoint not found")
        except Exception as e:
            logger.error(f"Unhandled DELETE exception on {path}: {e}\n{traceback.format_exc()}")
            self.last_status = 500
            return send_error(self, "Internal server error occurred.", status=500)
        finally:
            self._finish_request_log('DELETE', path)


def main():
    """Main application entry point with structured logging and database initialization."""
    if not os.path.exists(DB_FILE):
        import migrate
        migrate.run_migration(DB_FILE)

    server_address = ('', PORT)
    httpd = HTTPServer(server_address, CabAppHandler)

    logger.info("=" * 60)
    logger.info(f"🚀 SANGITA TRAVELS PUNE — PRODUCTION API SERVER (Port {PORT})")
    logger.info(f"📄 Customer Site:  http://localhost:{PORT}/")
    logger.info(f"🛡️ Protected Admin: http://localhost:{PORT}/admin")
    logger.info(f"🔐 Admin Login:    http://localhost:{PORT}/login.html")
    logger.info(f"🌍 Environment:    {ENVIRONMENT}")
    logger.info(f"💾 Relational DB:   {DB_FILE}")
    logger.info("=" * 60)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping server gracefully...")
        httpd.server_close()

if __name__ == '__main__':
    main()
