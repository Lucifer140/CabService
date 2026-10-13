"""
System Settings, SEO & Database Backup Controller
"""
import io
import datetime
from typing import Optional
from core.database import get_db
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.settings_repository import SettingsRepository
from repositories.seo_repository import SeoRepository
from repositories.audit_repository import AuditRepository

class SettingsController:
    @staticmethod
    def get_settings(handler):
        settings = SettingsRepository.get_all()
        return send_json(handler, {"success": True, "settings": settings})

    @staticmethod
    def update_settings(handler, user: dict):
        body = read_json_body(handler)
        key = body.get('key', '').strip()
        val = body.get('value', '')
        if not key:
            return send_error(handler, "Setting 'key' is required", status=400)

        SettingsRepository.update(key, str(val))
        AuditRepository.log(user['id'], user['username'], 'UPDATE_SETTING', 'settings', f"Updated {key}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": f"Setting '{key}' updated."})

    @staticmethod
    def batch_settings(handler, user: dict):
        body = read_json_body(handler)
        settings = body.get('settings', {})
        if not isinstance(settings, dict):
            return send_error(handler, "'settings' must be a JSON object mapping key to value", status=400)

        SettingsRepository.batch_update(settings)
        AuditRepository.log(user['id'], user['username'], 'BATCH_UPDATE_SETTINGS', 'settings', f"Updated {len(settings)} settings", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": f"Saved {len(settings)} settings."})

    @staticmethod
    def list_seo(handler):
        seo = SeoRepository.get_all()
        return send_json(handler, {"success": True, "seo": seo})

    @staticmethod
    def update_seo(handler, user: dict, path_page_id: Optional[str] = None):
        body = read_json_body(handler)
        page_id = (path_page_id or body.get('page_key') or body.get('page_identifier') or 'home').strip()
        SeoRepository.update_page(page_id, body)
        AuditRepository.log(user['id'], user['username'], 'UPDATE_SEO', 'seo', f"Updated SEO for {page_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": f"SEO for '{page_id}' updated."})

    @staticmethod
    def list_audit_logs(handler):
        logs = AuditRepository.list_logs(limit=150)
        return send_json(handler, {"success": True, "audit_logs": logs})

    @staticmethod
    def backup_sql(handler, user: dict):
        conn = get_db()
        sql_dump = io.StringIO()
        sql_dump.write("-- ============================================================\n")
        sql_dump.write("-- SANGITA TRAVELS PUNE — DATABASE SQL BACKUP\n")
        sql_dump.write(f"-- Generated At: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        sql_dump.write(f"-- Exported By: {user['username']} ({user['role']})\n")
        sql_dump.write("-- ============================================================\n\n")

        for line in conn.iterdump():
            sql_dump.write(f"{line}\n")
        conn.close()

        AuditRepository.log(user['id'], user['username'], 'BACKUP_SQL', 'database', 'Generated SQL dump', get_client_ip(handler))
        dump_data = sql_dump.getvalue().encode('utf-8')

        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        handler.send_response(200)
        handler.send_header('Content-Type', 'application/sql; charset=utf-8')
        handler.send_header('Content-Disposition', f'attachment; filename="sangita_backup_{timestamp}.sql"')
        handler.send_header('Content-Length', str(len(dump_data)))
        handler.send_header('Access-Control-Allow-Origin', '*')
        handler.end_headers()
        handler.wfile.write(dump_data)
