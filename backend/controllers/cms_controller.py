"""
CMS Content Controller
"""
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.content_repository import ContentRepository
from repositories.audit_repository import AuditRepository

class CmsController:
    @staticmethod
    def get_content(handler):
        blocks = ContentRepository.get_all()
        rows = ContentRepository.get_all_rows()
        return send_json(handler, {"success": True, "content": blocks, "raw_rows": rows})

    @staticmethod
    def update_block(handler, block_key: str, user: dict):
        body = read_json_body(handler)
        val = body.get('content_value', '')
        ContentRepository.update_block(block_key, str(val), updated_by=user['username'])
        AuditRepository.log(user['id'], user['username'], 'UPDATE_CMS_BLOCK', 'content', f"Updated {block_key}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": f"Block '{block_key}' updated."})

    @staticmethod
    def batch_update(handler, user: dict):
        body = read_json_body(handler)
        blocks = body.get('blocks', {})
        if not isinstance(blocks, dict):
            return send_error(handler, "'blocks' must be a JSON object mapping key to value", status=400)

        ContentRepository.batch_update(blocks, updated_by=user['username'])
        AuditRepository.log(user['id'], user['username'], 'BATCH_UPDATE_CMS', 'content', f"Updated {len(blocks)} blocks", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": f"Saved {len(blocks)} CMS blocks."})
