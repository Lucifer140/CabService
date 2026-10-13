"""
Cross-Site Request Forgery (CSRF) & Origin Defense Middleware
Validates origin and referer headers on state-changing requests to protect against
unauthorized cross-site requests while supporting mobile clients and legitimate API integrations.
"""
from urllib.parse import urlparse
from core.config import ENVIRONMENT

# Default trusted hosts for local development and production
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

class CsrfProtection:
    @classmethod
    def validate_request(cls, handler, method: str) -> bool:
        """
        Validates origin or referer on mutating HTTP methods (POST, PUT, DELETE).
        Returns True if request is legitimate; False if untrusted cross-origin request.
        """
        if method not in ('POST', 'PUT', 'DELETE'):
            return True

        origin = handler.headers.get('Origin', '')
        referer = handler.headers.get('Referer', '')

        # Check Origin header
        if origin:
            parsed = urlparse(origin)
            origin_base = f"{parsed.scheme}://{parsed.netloc}".lower()
            if origin_base in TRUSTED_ORIGINS:
                return True
            # In development, permit localhost ports
            if ENVIRONMENT == 'development' and parsed.hostname in ('localhost', '127.0.0.1'):
                return True
            return False

        # Fallback check Referer header
        if referer:
            parsed = urlparse(referer)
            referer_base = f"{parsed.scheme}://{parsed.netloc}".lower()
            if referer_base in TRUSTED_ORIGINS:
                return True
            if ENVIRONMENT == 'development' and parsed.hostname in ('localhost', '127.0.0.1'):
                return True
            return False

        # If neither Origin nor Referer is provided (e.g. CLI curl, automated webhook, direct mobile call),
        # permit the request unless in strict production mode with browser user agents
        user_agent = handler.headers.get('User-Agent', '').lower()
        if 'mozilla' in user_agent and ENVIRONMENT == 'production':
            # Browser navigation without origin or referer on POST is suspicious
            return False

        return True
