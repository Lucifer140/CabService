"""
Application Configuration and Constants
"""
import os
import sys

def load_env():
    """Load environment variables from .env file without external dependencies."""
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidates = [
        os.path.join(base, '.env'),
        os.path.join(base, '..', '.env')
    ]
    for env_path in candidates:
        if os.path.exists(env_path):
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith('#'):
                            continue
                        if '=' in line:
                            k, v = line.split('=', 1)
                            k, v = k.strip(), v.strip().strip('"').strip("'")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception as e:
                print(f"[!] Warning loading .env: {e}")
            break

load_env()

# Directory Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend'))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# Database Configuration
db_env = os.environ.get('DATABASE_PATH', 'data/bookings.db')
DB_FILE = db_env if os.path.isabs(db_env) else os.path.abspath(os.path.join(BASE_DIR, db_env))

# Server Network Configuration
PORT = int(os.environ.get('PORT', sys.argv[1] if len(sys.argv) > 1 else 8080))
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')

# Static Uploads Configuration
UPLOADS_DIR = os.path.join(FRONTEND_DIR, 'public', 'assets', 'uploads')
os.makedirs(UPLOADS_DIR, exist_ok=True)
legacy_uploads = os.path.join(FRONTEND_DIR, 'assets', 'uploads')
os.makedirs(legacy_uploads, exist_ok=True)

# Security & Session Settings
def _get_or_create_secret_key():
    env_key = os.environ.get('ADMIN_SECRET_KEY')
    if env_key and len(env_key) >= 32 and 'change_this' not in env_key:
        return env_key
    # Persist secure random 64-char key in data/.secret_key
    secret_file = os.path.join(DATA_DIR, '.secret_key')
    if os.path.exists(secret_file):
        try:
            with open(secret_file, 'r', encoding='utf-8') as f:
                k = f.read().strip()
                if len(k) >= 32:
                    return k
        except Exception:
            pass
    import secrets
    new_key = secrets.token_hex(32)
    try:
        with open(secret_file, 'w', encoding='utf-8') as f:
            f.write(new_key)
    except Exception:
        pass
    return new_key

ADMIN_SECRET_KEY = _get_or_create_secret_key()
SESSION_EXPIRY_DAYS = int(os.environ.get('SESSION_EXPIRY_DAYS', 30))


# Business Identity Credentials
BUSINESS_NAME = os.environ.get('BUSINESS_NAME', 'Sangita Travels Pune')
WHATSAPP_NUMBER = os.environ.get('WHATSAPP_NUMBER', '918261021008')
SUPPORT_PHONE = os.environ.get('SUPPORT_PHONE', '8261021008')
SUPPORT_EMAIL = os.environ.get('SUPPORT_EMAIL', 'shitalupadhye287@gmail.com')
BUSINESS_ADDRESS = os.environ.get('BUSINESS_ADDRESS', 'Pune, Maharashtra, India')

# WhatsApp Business API Configuration
WHATSAPP_ENABLED = os.environ.get('WHATSAPP_ENABLED', 'false').lower() in ('true', '1', 'yes')
WHATSAPP_API_TOKEN = os.environ.get('WHATSAPP_API_TOKEN', '')
WHATSAPP_PHONE_NUMBER_ID = os.environ.get('WHATSAPP_PHONE_NUMBER_ID', '')
WHATSAPP_BUSINESS_ACCOUNT_ID = os.environ.get('WHATSAPP_BUSINESS_ACCOUNT_ID', '')
WHATSAPP_ADMIN_RECIPIENT = os.environ.get('WHATSAPP_ADMIN_RECIPIENT', WHATSAPP_NUMBER)

# SMTP Email Configuration
SMTP_ENABLED = os.environ.get('SMTP_ENABLED', 'false').lower() in ('true', '1', 'yes')
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', SUPPORT_EMAIL)
ADMIN_NOTIFICATION_EMAIL = os.environ.get('ADMIN_NOTIFICATION_EMAIL', SUPPORT_EMAIL)

# Google Maps API Configuration
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')

# Razorpay Payment Gateway Configuration
RAZORPAY_ENABLED = os.environ.get('RAZORPAY_ENABLED', 'false').lower() in ('true', '1', 'yes')
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')

# Role definitions & hierarchy
ROLES = {
    'SUPER_ADMIN': {
        'title': 'Super Admin',
        'permissions': ['*']
    },
    'ADMIN': {
        'title': 'Admin',
        'permissions': ['dashboard', 'bookings:*', 'customers:*', 'fleet:*', 'drivers:*',
                        'tours:*', 'services:*', 'pricing:*', 'coupons:*', 'reviews:*',
                        'analytics:*', 'export:*', 'media:*']
    },
    'MANAGER': {
        'title': 'Manager',
        'permissions': ['dashboard', 'bookings:read', 'bookings:write', 'customers:read', 'customers:write', 
                        'fleet:read', 'fleet:write', 'tours:read', 'tours:write', 'services:read', 'services:write',
                        'analytics:read', 'export:read', 'pricing:read']
    },
    'STAFF': {
        'title': 'Staff',
        'permissions': ['dashboard', 'bookings:read', 'bookings:write', 'customers:read', 'customers:contact', 'fleet:read']
    },
    'BOOKING_STAFF': {
        'title': 'Booking Staff',
        'permissions': ['dashboard', 'bookings:read', 'bookings:write', 'customers:read', 'customers:contact', 'fleet:read']
    },
    'DRIVER': {
        'title': 'Driver',
        'permissions': ['driver:trips:read', 'driver:profile:read', 'driver:status:write']
    },
    'CUSTOMER': {
        'title': 'Customer',
        'permissions': ['customer:bookings:read', 'customer:profile:write']
    },
    'CONTENT_MANAGER': {
        'title': 'Content Manager',
        'permissions': ['content:read', 'content:write', 'services:read', 'services:write', 'tours:read', 'tours:write',
                        'fleet:read', 'fleet:content', 'media:read', 'media:write', 'seo:read', 'seo:write']
    }
}
