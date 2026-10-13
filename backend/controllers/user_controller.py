"""
Admin User Management Controller (RBAC & Safeguards)
"""
import re
from urllib.parse import urlparse, parse_qs
from core.config import ROLES
from core.security import hash_password, validate_password_strength
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.user_repository import UserRepository
from repositories.audit_repository import AuditRepository

class UserController:
    @staticmethod
    def list_users(handler):
        """Lists users with optional filtering by search query, role, or status."""
        parsed = urlparse(handler.path)
        qs = parse_qs(parsed.query)
        search = qs.get('search', [None])[0]
        role = qs.get('role', [None])[0]
        status = qs.get('status', [None])[0]

        users = UserRepository.list_all(search=search, role=role, status=status)
        return send_json(handler, {"success": True, "users": users, "count": len(users)})

    @staticmethod
    def create_user(handler, current_user: dict):
        """Creates a new administrative or staff account with server-side validation."""
        ip_addr = get_client_ip(handler)
        body = read_json_body(handler)
        username = body.get('username', '').strip()
        password = body.get('password', '').strip()
        full_name = body.get('full_name', '').strip()
        email = body.get('email', '').strip().lower()
        phone = body.get('phone', '').strip()
        role = body.get('role', 'BOOKING_STAFF').strip().upper()

        if not username or not password or not full_name or not email:
            return send_error(handler, "Username, password, email, and full name are required.", status=400)

        # Validate username format
        if not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
            return send_error(handler, "Username must be 3-30 characters and contain only letters, numbers, and underscores.", status=400)

        # Validate email format
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
            return send_error(handler, "Please provide a valid email address.", status=400)

        # Validate password strength
        is_strong, reason = validate_password_strength(password)
        if not is_strong:
            return send_error(handler, reason, status=400)

        # Validate role
        if role not in ROLES:
            return send_error(handler, f"Invalid role specified. Approved roles: {', '.join(ROLES.keys())}", status=400)

        # Only Super Admins can grant the Super Admin role
        if role == 'SUPER_ADMIN' and current_user.get('role') != 'SUPER_ADMIN':
            return send_error(handler, "Only Super Admins can assign the Super Admin role.", status=403)

        # Check for duplicate username
        if UserRepository.get_by_username(username):
            return send_error(handler, f"Username '{username}' is already in use.", status=400)

        # Check for duplicate email
        if UserRepository.get_by_email(email):
            return send_error(handler, f"Email '{email}' is already in use by another account.", status=400)

        pwd_hash, salt = hash_password(password)
        u_id = UserRepository.create(username, pwd_hash, salt, full_name, phone, email, role)

        AuditRepository.log(
            current_user['id'],
            current_user['username'],
            'CREATE_USER',
            'users',
            f"Created user {username} with role {role} (ID: {u_id})",
            ip_addr
        )

        return send_json(handler, {
            "success": True,
            "id": u_id,
            "message": f"User {username} created successfully."
        }, status=201)

    @staticmethod
    def update_user(handler, target_user_id: int, current_user: dict):
        """Updates user details with strict safeguards against lockout and privilege escalation."""
        ip_addr = get_client_ip(handler)
        body = read_json_body(handler)
        target = UserRepository.get_by_id(target_user_id)
        if not target:
            return send_error(handler, "User not found.", status=404)

        full_name = body.get('full_name', target['full_name']).strip()
        phone = body.get('phone', target['phone']).strip()
        email = body.get('email', target['email']).strip().lower()
        role = body.get('role', target['role']).strip().upper()
        is_active = int(body.get('is_active', target['is_active']))

        # Safeguard 1: Prevent user from modifying their own administrative role
        if target_user_id == current_user['id'] and role != target['role']:
            return send_error(handler, "You cannot modify your own administrative role.", status=400)

        # Safeguard 2: Prevent user from deactivating their own account
        if target_user_id == current_user['id'] and is_active == 0:
            return send_error(handler, "You cannot deactivate your own account.", status=400)

        # Safeguard 3: Prevent demoting or deactivating the last active Super Admin
        if target['role'] == 'SUPER_ADMIN' and (is_active == 0 or role != 'SUPER_ADMIN'):
            active_count = UserRepository.count_active_super_admins()
            if active_count <= 1:
                return send_error(
                    handler,
                    "Cannot deactivate or demote the last active Super Admin. At least one active Super Admin must remain in the system.",
                    status=400
                )

        # Safeguard 4: Only Super Admins can promote someone to Super Admin
        if role == 'SUPER_ADMIN' and target['role'] != 'SUPER_ADMIN' and current_user.get('role') != 'SUPER_ADMIN':
            return send_error(handler, "Only Super Admins can assign the Super Admin role.", status=403)

        # Validate email format
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
            return send_error(handler, "Please provide a valid email address.", status=400)

        # Check duplicate email against other accounts
        existing_email_user = UserRepository.get_by_email(email)
        if existing_email_user and existing_email_user['id'] != target_user_id:
            return send_error(handler, f"Email '{email}' is already in use by another account.", status=400)

        # Validate role exists
        if role not in ROLES:
            return send_error(handler, f"Invalid role specified.", status=400)

        # If account is being deactivated, revoke all its active sessions immediately
        if is_active == 0 and target['is_active'] == 1:
            UserRepository.revoke_all_sessions(target_user_id)

        UserRepository.update(target_user_id, full_name, phone, email, role, is_active)

        # Optional password update
        new_pwd = body.get('password', '').strip()
        if new_pwd:
            is_strong, reason = validate_password_strength(new_pwd)
            if not is_strong:
                return send_error(handler, reason, status=400)
            pwd_hash, salt = hash_password(new_pwd)
            UserRepository.update_password(target_user_id, pwd_hash, salt)

        AuditRepository.log(
            current_user['id'],
            current_user['username'],
            'UPDATE_USER',
            'users',
            f"Updated user {target['username']} (role={role}, is_active={is_active})",
            ip_addr
        )

        return send_json(handler, {"success": True, "message": f"User {target['username']} updated successfully."})

    @staticmethod
    def toggle_status(handler, target_user_id: int, current_user: dict):
        """Activates or deactivates an administrative account."""
        ip_addr = get_client_ip(handler)
        target = UserRepository.get_by_id(target_user_id)
        if not target:
            return send_error(handler, "User not found.", status=404)

        current_status = target.get('is_active', 1)
        new_status = 0 if current_status == 1 else 1

        if new_status == 0:
            if target_user_id == current_user['id']:
                return send_error(handler, "You cannot deactivate your own account.", status=400)

            if target['role'] == 'SUPER_ADMIN' and UserRepository.count_active_super_admins() <= 1:
                return send_error(
                    handler,
                    "Cannot deactivate the last active Super Admin. At least one active Super Admin must remain in the system.",
                    status=400
                )

        UserRepository.update(
            target_user_id,
            target['full_name'],
            target['phone'],
            target['email'],
            target['role'],
            new_status
        )

        if new_status == 0:
            UserRepository.revoke_all_sessions(target_user_id)

        action_name = "DEACTIVATE_USER" if new_status == 0 else "ACTIVATE_USER"
        AuditRepository.log(
            current_user['id'],
            current_user['username'],
            action_name,
            'users',
            f"{action_name} for user {target['username']}",
            ip_addr
        )

        return send_json(handler, {
            "success": True,
            "is_active": new_status,
            "message": f"User {target['username']} has been {'deactivated' if new_status == 0 else 'activated'}."
        })

    @staticmethod
    def delete_user(handler, target_user_id: int, current_user: dict):
        """Deletes user while preventing self-deletion or deletion of the last active Super Admin."""
        ip_addr = get_client_ip(handler)
        if target_user_id == current_user['id']:
            return send_error(handler, "Cannot delete your own account.", status=400)

        target = UserRepository.get_by_id(target_user_id)
        if not target:
            return send_error(handler, "User not found.", status=404)

        if target['role'] == 'SUPER_ADMIN' and UserRepository.count_active_super_admins() <= 1:
            return send_error(
                handler,
                "Cannot delete the last active Super Admin. At least one active Super Admin must remain in the system.",
                status=400
            )

        UserRepository.delete(target_user_id)

        AuditRepository.log(
            current_user['id'],
            current_user['username'],
            'DELETE_USER',
            'users',
            f"Deleted user {target['username']} (role={target['role']})",
            ip_addr
        )

        return send_json(handler, {"success": True, "message": f"User {target['username']} deleted successfully."})
