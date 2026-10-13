"""
HTTP Response & Request Parsing Utilities
"""
import json

def get_client_ip(handler) -> str:
    """Extracts client IP address from socket or returns 127.0.0.1."""
    return handler.client_address[0] if handler.client_address else '127.0.0.1'

def read_json_body(handler) -> dict:
    """Safely extracts, parses and sanitizes JSON payload from incoming HTTP request body."""
    try:
        length = int(handler.headers.get('Content-Length', 0))
        if length == 0:
            return {}
        raw = handler.rfile.read(length).decode('utf-8')
        data = json.loads(raw)
        from core.security import sanitize_dict
        return sanitize_dict(data)
    except Exception:
        return {}


from urllib.parse import urlparse

TRUSTED_ORIGINS = {
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
    'https://sangitatravelspune.com',
    'https://www.sangitatravelspune.com',
    'https://punemumbaicab.com',
    'https://www.punemumbaicab.com'
}

def apply_security_headers(handler):
    """Applies strict security headers, CORS origin whitelisting, and CSP policy."""
    origin = handler.headers.get('Origin', '')
    allowed = False
    if origin:
        try:
            parsed = urlparse(origin)
            origin_clean = f"{parsed.scheme}://{parsed.netloc}".lower()
            if origin_clean in TRUSTED_ORIGINS or parsed.hostname in ('localhost', '127.0.0.1'):
                allowed = True
        except Exception:
            allowed = False

    if allowed:
        handler.send_header('Access-Control-Allow-Origin', origin)
        handler.send_header('Access-Control-Allow-Credentials', 'true')
    else:
        handler.send_header('Access-Control-Allow-Origin', '*')

    handler.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    handler.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Request-ID')
    handler.send_header('X-Content-Type-Options', 'nosniff')
    handler.send_header('X-Frame-Options', 'SAMEORIGIN')
    handler.send_header('X-XSS-Protection', '1; mode=block')
    handler.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
    handler.send_header('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
    
    # Request ID tracking
    req_id = getattr(handler, 'request_id', None) or handler.headers.get('X-Request-ID')
    if req_id:
        handler.send_header('X-Request-ID', str(req_id))

    handler.send_header(
        'Content-Security-Policy',
        "default-src 'self' 'unsafe-inline' https:; "
        "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https: blob:; "
        "connect-src 'self' https:; "
        "frame-src https://api.razorpay.com https://checkout.razorpay.com;"
    )

def send_json(handler, data: dict, status: int = 200, extra_headers: dict = None):
    """Sends JSON encoded response with standard CORS & security headers."""
    # Track status on handler for request logger
    handler.last_status = status
    body = json.dumps(data, default=str).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
    apply_security_headers(handler)
    if extra_headers:
        for k, v in extra_headers.items():
            handler.send_header(k, v)
    handler.end_headers()
    handler.wfile.write(body)


def send_error(handler, error_message: str, status: int = 400):
    """Convenience helper to send a standard error JSON envelope."""
    return send_json(handler, {"success": False, "error": error_message}, status=status)

def send_csv(handler, filename: str, csv_content: str):
    """Sends raw CSV content as a downloadable attachment."""
    body = csv_content.encode('utf-8')
    handler.send_response(200)
    handler.send_header('Content-Type', 'text/csv; charset=utf-8')
    handler.send_header('Content-Disposition', f'attachment; filename="{filename}"')
    handler.send_header('Content-Length', str(len(body)))
    apply_security_headers(handler)
    handler.end_headers()
    handler.wfile.write(body)

def send_html(handler, html_content: str, status: int = 200):
    """Sends raw HTML response with standard UTF-8 headers."""
    body = html_content.encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type', 'text/html; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    apply_security_headers(handler)
    handler.end_headers()
    handler.wfile.write(body)



def get_auth_token(handler):
    """Extracts authorization Bearer token from header or admin_token cookie."""
    auth_header = handler.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header.split(' ', 1)[1].strip()
    cookie_header = handler.headers.get('Cookie', '')
    for part in cookie_header.split(';'):
        part = part.strip()
        if part.startswith('admin_token='):
            return part.split('=', 1)[1].strip()
    return None
