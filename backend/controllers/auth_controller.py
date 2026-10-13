"""
Authentication & Session Controller
"""
from __future__ import annotations
import datetime
from typing import Optional
from core.config import ROLES
from core.security import verify_password, generate_session_token
from core.response import send_json, send_error, read_json_body, get_client_ip, get_auth_token
from repositories.user_repository import UserRepository
from repositories.audit_repository import AuditRepository
from services.email_service import EmailService

class AuthController:
    @staticmethod
    def login(handler):
        ip_addr = get_client_ip(handler)
        body = read_json_body(handler)
        identifier = (body.get('email') or body.get('username') or '').strip()
        password = body.get('password', '').strip()
        remember = bool(body.get('remember', False))

        if not identifier or not password:
            return send_error(handler, "Email/username and password are required.", status=400)

        admin = UserRepository.get_by_identifier(identifier)
        if not admin:
            AuditRepository.log(0, identifier, 'LOGIN_FAILED', 'auth', 'Unknown user identifier', ip_addr)
            return send_error(handler, "Invalid credentials.", status=401)

        # Check account lock status
        now = datetime.datetime.now()
        locked_until = admin.get('locked_until')
        if locked_until:
            try:
                locked_dt = datetime.datetime.strptime(locked_until, '%Y-%m-%d %H:%M:%S')
                if now < locked_dt:
                    remaining_mins = max(1, int((locked_dt - now).total_seconds() / 60))
                    return send_error(handler, f"Account temporarily locked due to failed attempts. Try again in {remaining_mins} min(s).", status=403)
            except Exception:
                pass

        if not admin.get('is_active', 1):
            return send_error(handler, "Account has been deactivated. Contact Super Admin.", status=403)

        # Verify PBKDF2 Password Hash
        stored_hash = admin.get('password_hash', '')
        stored_salt = admin.get('password_salt', '')
        if not verify_password(password, stored_hash, stored_salt):
            failed = (admin.get('failed_attempts') or 0) + 1
            locked_until_str: Optional[str] = None
            if failed >= 5:
                lock_time = now + datetime.timedelta(minutes=15)
                locked_until_str = lock_time.strftime('%Y-%m-%d %H:%M:%S')
                AuditRepository.log(admin['id'], admin['username'], 'ACCOUNT_LOCKED', 'auth', 'Account locked after 5 failed attempts', ip_addr)

            UserRepository.record_failed_attempt(admin['id'], failed, locked_until_str)
            
            err_msg = "Invalid password."
            if failed >= 5:
                err_msg += " Account locked for 15 minutes."
            else:
                err_msg += f" {5 - failed} attempt(s) remaining."
            return send_error(handler, err_msg, status=401)

        # Valid Login: Reset failed attempts & issue session token
        token = generate_session_token()
        days = 30 if remember else 7
        expires_at = (now + datetime.timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')
        user_agent = handler.headers.get('User-Agent', '')[:250]

        UserRepository.create_session(token, admin['id'], ip_addr, user_agent, expires_at)
        UserRepository.reset_failed_attempts(admin['id'])

        AuditRepository.log(admin['id'], admin['username'], 'LOGIN_SUCCESS', 'auth', f"Role: {admin['role']}", ip_addr)

        from core.config import ENVIRONMENT
        sec_flag = "; Secure" if ENVIRONMENT == "production" else ""
        cookie_val = f"admin_token={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={days * 86400}{sec_flag}"
        user_info = {

            "id": admin['id'],
            "username": admin['username'],
            "email": admin['email'],
            "full_name": admin['full_name'],
            "role": admin['role']
        }
        return send_json(handler, {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": user_info,
            "admin": user_info,
            "permissions": ROLES.get(admin['role'], {}).get('permissions', [])
        }, extra_headers={"Set-Cookie": cookie_val})

    @staticmethod
    def logout(handler):
        token = get_auth_token(handler)
        if token:
            user = UserRepository.get_session_user(token)
            if user:
                AuditRepository.log(user['id'], user['username'], 'LOGOUT', 'auth', 'User logged out', get_client_ip(handler))
            UserRepository.delete_session(token)

        clear_cookie = "admin_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0"
        return send_json(handler, {"success": True, "message": "Logged out successfully."}, extra_headers={"Set-Cookie": clear_cookie})

    @staticmethod
    def auth_check(handler):
        token = get_auth_token(handler)
        if not token:
            return send_json(handler, {"authenticated": False}, status=401)
        user = UserRepository.get_session_user(token)
        if not user:
            return send_json(handler, {"authenticated": False}, status=401)

        return send_json(handler, {
            "authenticated": True,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "full_name": user['full_name'],
                "email": user['email'],
                "role": user['role']
            },
            "permissions": ROLES.get(user['role'], {}).get('permissions', [])
        })

    # Password Reset Store: {email_or_token: {"code": "...", "expires_at": dt, "admin_id": id}}
    _reset_tokens = {}

    @classmethod
    def forgot_password(cls, handler):
        body = read_json_body(handler)
        ident = body.get('email') or body.get('username') or ''
        ident = ident.strip()
        if not ident:
            return send_error(handler, "Username or registered email address required.", status=400)

        admin = UserRepository.get_by_identifier(ident)
        if not admin or not admin.get('email'):
            # Return uniform message to prevent user enumeration
            return send_json(handler, {
                "success": True,
                "message": "If an active account exists with this email, password reset instructions have been dispatched."
            })

        import secrets
        reset_code = f"{secrets.randbelow(900000) + 100000}"
        token = secrets.token_urlsafe(24)
        expires = datetime.datetime.now() + datetime.timedelta(minutes=30)

        cls._reset_tokens[admin['email'].lower()] = {
            "code": reset_code,
            "token": token,
            "admin_id": admin['id'],
            "expires_at": expires
        }

        reset_url = f"http://localhost:8080/reset-password.html?token={token}&email={admin['email']}"
        res = EmailService.send_password_reset(admin['email'], admin['username'], reset_code, reset_url)
        AuditRepository.log(admin['id'], admin['username'], 'FORGOT_PASSWORD_REQUEST', 'auth', f"Reset code sent to {admin['email']}", get_client_ip(handler))

        return send_json(handler, {
            "success": True,
            "message": "Password reset instructions dispatched to registered email address.",
            "email": admin['email'],
            "simulated": res.get('simulated', False)
        })

    @classmethod
    def reset_password(cls, handler):
        body = read_json_body(handler)
        email = (body.get('email') or '').strip().lower()
        code = (body.get('code') or body.get('token') or '').strip()
        new_password = (body.get('password') or body.get('new_password') or '').strip()

        if not email or not code or not new_password:
            return send_error(handler, "Email, verification code, and new password are required.", status=400)

        from core.security import validate_password_strength, hash_password
        valid_pwd, pwd_err = validate_password_strength(new_password)
        if not valid_pwd:
            return send_error(handler, pwd_err, status=400)


        token_record = cls._reset_tokens.get(email)
        if not token_record:
            return send_error(handler, "No active password reset request found for this email.", status=400)

        if datetime.datetime.now() > token_record['expires_at']:
            del cls._reset_tokens[email]
            return send_error(handler, "Password reset code has expired. Please request a new one.", status=400)

        import hmac
        code_match = hmac.compare_digest(code, token_record.get('code', '')) or hmac.compare_digest(code, token_record.get('token', ''))
        if not code_match:
            token_record['failed_attempts'] = token_record.get('failed_attempts', 0) + 1
            if token_record['failed_attempts'] >= 5:
                del cls._reset_tokens[email]
                AuditRepository.log(token_record.get('admin_id', 0), email, 'RESET_ATTEMPTS_EXCEEDED', 'auth', "Reset token destroyed after 5 failed code attempts", get_client_ip(handler))
                return send_error(handler, "Too many failed verification attempts. Password reset request has been invalidated.", status=403)
            remaining = 5 - token_record['failed_attempts']
            return send_error(handler, f"Invalid verification code or token. {remaining} attempt(s) remaining.", status=400)

        from core.security import hash_password
        admin_id = token_record['admin_id']
        pwd_hash, pwd_salt = hash_password(new_password)
        UserRepository.update_password(admin_id, pwd_hash, pwd_salt)
        del cls._reset_tokens[email]

        AuditRepository.log(admin_id, email, 'PASSWORD_RESET_SUCCESS', 'auth', "Password successfully reset", get_client_ip(handler))
        return send_json(handler, {
            "success": True,
            "message": "Password has been successfully reset! You can now log in with your new password."
        })

