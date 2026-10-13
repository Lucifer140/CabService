"""
Security, Password Hashing & RBAC Authorization
"""
import hashlib
import secrets
from core.config import ROLES

def hash_password(password: str, salt: str = None):
    """Hashes password with PBKDF2-HMAC-SHA256 and a random 16-byte salt."""
    if not salt:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return pwd_hash, salt

import hmac

def verify_password(password: str, stored_hash: str, salt: str):
    """Verifies a plain password against the stored PBKDF2 hash and salt using constant-time comparison."""
    if not stored_hash:
        return False
    if not salt:
        # Fallback to legacy sha256 without salt for backward compatibility
        legacy_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        return hmac.compare_digest(legacy_hash, stored_hash)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return hmac.compare_digest(pwd_hash, stored_hash)

def generate_session_token() -> str:
    """Generates a secure 32-byte (64-char hex) session token."""
    return secrets.token_hex(32)

def check_permission(user: dict, required_perm: str) -> bool:
    """Verifies if the given authenticated user has the required RBAC permission."""
    if not user:
        return False
    user_role = user.get('role', 'BOOKING_STAFF')
    perms = ROLES.get(user_role, {}).get('permissions', [])
    if '*' in perms or required_perm in perms:
        return True
    # Check wildcard category e.g. bookings:* or bookings:write
    cat = required_perm.split(':')[0]
    if f"{cat}:*" in perms or f"{cat}:write" in perms:
        return True
    return False

import re
import html

def sanitize_text(text: str) -> str:
    """Sanitizes user string input against XSS, null-byte injection, and dangerous tags."""
    if not isinstance(text, str):
        return text
    # Remove null bytes
    cleaned = text.replace('\x00', '')
    # Strip script and iframe tags
    cleaned = re.sub(r'<\s*script[^>]*>.*?<\s*/\s*script\s*>', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r'<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
    # Strip javascript: and vbscript: URIs
    cleaned = re.sub(r'javascript\s*:', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'vbscript\s*:', '', cleaned, flags=re.IGNORECASE)
    # Strip dangerous HTML event handlers (onload, onerror, onclick, etc.)
    cleaned = re.sub(r'\bon\w+\s*=', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

def sanitize_dict(data):
    """Recursively sanitizes dict or list structures containing user submitted data."""
    if isinstance(data, dict):
        return {k: sanitize_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_dict(item) for item in data]
    elif isinstance(data, str):
        return sanitize_text(data)
    return data

def validate_password_strength(password: str) -> tuple:
    """
    Enforces secure password policy:
    Minimum 8 characters, at least one letter, and at least one number.
    Returns (is_valid: bool, reason: str).
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters in length."
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one alphabetic letter."
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one numeric digit."
    return True, ""

