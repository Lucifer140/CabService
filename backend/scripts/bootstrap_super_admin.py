#!/usr/bin/env python3
"""
Sangita Travels Pune — Super Admin Bootstrap Utility
File: backend/scripts/bootstrap_super_admin.py

Safely bootstraps or rotates the initial Super Admin account.
- Never hardcodes or prints passwords.
- Enforces PBKDF2-HMAC-SHA256 hashing with random 16-byte salt.
- Strictly validates email format and password complexity.
- Idempotent and safe to rerun.
- Logs all operations to the tamper-evident audit_logs table.
"""
import sys
import os
import re
import getpass
import argparse
from typing import Optional

# Add backend directory to sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from core.security import hash_password, validate_password_strength
from repositories.user_repository import UserRepository
from repositories.audit_repository import AuditRepository

DEFAULT_EMAIL = "shitalupadhye2001@gmail.com"
DEFAULT_NAME = "Shital Upadhye"

def normalize_email(email: str) -> str:
    """Normalizes and trims email string."""
    return (email or '').strip().lower()

def validate_email_format(email: str) -> bool:
    """Validates email format against standard regex."""
    return bool(re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email))

def get_password(prompt_text="Enter Super Admin Password: ", confirm=True) -> str:
    """Reads password from SUPER_ADMIN_PASSWORD env var or interactive secure prompt."""
    env_pwd = os.environ.get('SUPER_ADMIN_PASSWORD')
    if env_pwd:
        pwd = env_pwd.strip()
        is_valid, msg = validate_password_strength(pwd)
        if not is_valid:
            print(f"[!] Error: SUPER_ADMIN_PASSWORD does not meet security requirements: {msg}", file=sys.stderr)
            sys.exit(1)
        return pwd

    # Interactive prompt via getpass (does not echo to terminal)
    if not sys.stdin.isatty():
        print("[!] Error: No interactive terminal detected and SUPER_ADMIN_PASSWORD is not set.", file=sys.stderr)
        print("    Please set the SUPER_ADMIN_PASSWORD environment variable or run in an interactive shell.", file=sys.stderr)
        sys.exit(1)

    while True:
        pwd = getpass.getpass(prompt_text).strip()
        is_valid, msg = validate_password_strength(pwd)
        if not is_valid:
            print(f"[!] Password rejected: {msg}")
            continue

        if confirm:
            pwd_confirm = getpass.getpass("Confirm Super Admin Password: ").strip()
            if pwd != pwd_confirm:
                print("[!] Passwords do not match. Please try again.")
                continue

        return pwd

def bootstrap_super_admin(email: str, username: Optional[str] = None, full_name: Optional[str] = None, rotate: bool = False, check_only: bool = False):
    """Executes the idempotent Super Admin bootstrap or password rotation."""
    clean_email = normalize_email(email)
    if not validate_email_format(clean_email):
        print(f"[!] Error: Invalid email format: '{clean_email}'", file=sys.stderr)
        return 1

    existing = UserRepository.get_by_email(clean_email)

    if check_only:
        if existing:
            status_str = "ACTIVE" if existing['is_active'] else "DEACTIVATED"
            print(f"[✓] Super Admin check: Account exists for {clean_email}")
            print(f"    ID: {existing['id']} | Username: @{existing['username']} | Role: {existing['role']} | Status: {status_str}")
            return 0
        else:
            print(f"[*] Super Admin check: No account found for email {clean_email}.")
            return 1

    if existing:
        if not rotate:
            status_str = "Active" if existing['is_active'] else "Deactivated"
            print("=" * 70)
            print("SANGITA TRAVELS PUNE — SUPER ADMIN BOOTSTRAP")
            print("=" * 70)
            print(f"[*] Idempotent Check: Super Admin already exists for '{clean_email}'.")
            print(f"    User ID:      {existing['id']}")
            print(f"    Username:     @{existing['username']}")
            print(f"    Full Name:    {existing['full_name']}")
            print(f"    Role:         {existing['role']}")
            print(f"    Status:       {status_str}")
            print(f"    Created At:   {existing.get('created_at', 'N/A')}")
            print("-" * 70)
            print("[✓] No changes made. System is secure and ready.")
            print("[*] To rotate credentials for this account, run with --rotate-password.")
            print("=" * 70)
            return 0

        # Rotate password flow
        print(f"[*] Initiating credential rotation for Super Admin: {clean_email} (@{existing['username']})")
        new_pwd = get_password("Enter NEW Super Admin Password: ")
        pwd_hash, salt = hash_password(new_pwd)

        UserRepository.update_password(existing['id'], pwd_hash, salt)
        # Ensure account is active and role is SUPER_ADMIN
        UserRepository.update(
            existing['id'],
            existing['full_name'],
            existing.get('phone', ''),
            clean_email,
            'SUPER_ADMIN',
            1
        )
        # Invalidate existing sessions
        UserRepository.revoke_all_sessions(existing['id'])

        AuditRepository.log(
            existing['id'],
            existing['username'],
            'SUPER_ADMIN_PASSWORD_ROTATED',
            'auth',
            f"Super Admin password rotated for {clean_email}",
            '127.0.0.1'
        )

        print("=" * 70)
        print("[✓] Super Admin credentials successfully rotated!")
        print(f"    Email:        {clean_email}")
        print(f"    Username:     @{existing['username']}")
        print(f"    Role:         SUPER_ADMIN")
        print(f"    Status:       Active")
        print(f"    Password:     [SECURELY HASHED - PBKDF2-HMAC-SHA256 (100,000 iterations)]")
        print(f"    Active Tokens: All previous sessions revoked")
        print("=" * 70)
        return 0

    # New Super Admin creation
    print("=" * 70)
    print("SANGITA TRAVELS PUNE — BOOTSTRAPPING INITIAL SUPER ADMIN")
    print("=" * 70)
    print(f"[*] Account Email: {clean_email}")

    # Determine username
    target_username = (username or clean_email.split('@')[0].replace('.', '_')[:25]).strip().lower()
    # Check if target username already exists in database
    existing_u = UserRepository.get_by_username(target_username)
    if existing_u:
        target_username = f"{target_username}_superadmin"

    pwd = get_password("Enter Super Admin Password: ")
    pwd_hash, salt = hash_password(pwd)
    full_name_val = full_name or DEFAULT_NAME

    u_id = UserRepository.create(
        username=target_username,
        password_hash=pwd_hash,
        password_salt=salt,
        full_name=full_name_val,
        phone="8261021008",
        email=clean_email,
        role="SUPER_ADMIN"
    )

    AuditRepository.log(
        u_id,
        target_username,
        'SUPER_ADMIN_BOOTSTRAP',
        'auth',
        f"Initial Super Admin bootstrapped: {clean_email}",
        '127.0.0.1'
    )

    print("=" * 70)
    print("[✓] Super Admin bootstrapped successfully!")
    print(f"    Account ID:   {u_id}")
    print(f"    Email:        {clean_email}")
    print(f"    Username:     @{target_username}")
    print(f"    Full Name:    {full_name_val}")
    print(f"    Role:         SUPER_ADMIN")
    print(f"    Status:       Active")
    print(f"    Security:     PBKDF2-HMAC-SHA256 (100,000 iterations, 16-byte random salt)")
    print("=" * 70)
    print("[*] You can now log in at: http://localhost:8080/#/admin/login")
    return 0

def main():
    parser = argparse.ArgumentParser(
        description="Bootstrap or rotate the initial Super Admin account for Sangita Travels Pune."
    )
    parser.add_argument(
        '--email',
        default=DEFAULT_EMAIL,
        help=f"Email address for the Super Admin account (default: {DEFAULT_EMAIL})"
    )
    parser.add_argument(
        '--username',
        default=None,
        help="Optional username (defaults to email local-part)"
    )
    parser.add_argument(
        '--full-name',
        default=DEFAULT_NAME,
        help=f"Full name for the administrator (default: {DEFAULT_NAME})"
    )
    parser.add_argument(
        '--rotate-password',
        action='store_true',
        help="Rotate password for existing Super Admin"
    )
    parser.add_argument(
        '--check',
        action='store_true',
        help="Check whether the Super Admin account already exists"
    )

    args = parser.parse_args()
    code = bootstrap_super_admin(
        email=args.email,
        username=args.username,
        full_name=args.full_name,
        rotate=args.rotate_password,
        check_only=args.check
    )
    sys.exit(code)

if __name__ == '__main__':
    main()
