"""
Services Controller
"""
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.service_repository import ServiceRepository
from repositories.audit_repository import AuditRepository

class ServiceController:
    @staticmethod
    def list_services(handler):
        services = ServiceRepository.list_all(active_only=False)
        return send_json(handler, {"success": True, "services": services})

    @staticmethod
    def create_service(handler, user: dict):
        body = read_json_body(handler)
        title = body.get('title', '').strip()
        if not title:
            return send_error(handler, "Service title is required", status=400)

        slug = body.get('slug', '').strip() or title.lower().replace(' ', '-')
        if 'is_active' in body:
            is_act = 1 if body['is_active'] in (1, '1', True, 'true', 'TRUE') else 0
        else:
            is_act = 1

        raw_order = body.get('display_order') if 'display_order' in body else body.get('sort_order', 0)
        try:
            display_order = int(raw_order) if raw_order is not None else 0
        except (ValueError, TypeError):
            display_order = 0

        s_id = ServiceRepository.create({
            "title": title,
            "slug": slug,
            "description": body.get('description', body.get('short_desc', '')),
            "icon": body.get('icon', 'car').strip(),
            "image_url": body.get('image_url', '').strip(),
            "is_active": is_act,
            "display_order": display_order
        })

        AuditRepository.log(user['id'], user['username'], 'CREATE_SERVICE', 'services', f"Created {title}", get_client_ip(handler))
        return send_json(handler, {"success": True, "id": s_id, "message": "Service created."}, status=201)

    @staticmethod
    def update_service(handler, service_id: int, user: dict):
        body = read_json_body(handler)
        srv = ServiceRepository.get_by_id(service_id)
        if not srv:
            return send_error(handler, "Service not found", status=404)

        if 'is_active' in body:
            is_act = 1 if body['is_active'] in (1, '1', True, 'true', 'TRUE') else 0
        else:
            is_act = srv.get('is_active', 1)

        if 'display_order' in body or 'sort_order' in body:
            raw_order = body.get('display_order') if 'display_order' in body else body.get('sort_order')
            try:
                display_order = int(raw_order) if raw_order is not None else srv.get('display_order', 0)
            except (ValueError, TypeError):
                display_order = 0
        else:
            display_order = srv.get('display_order', 0)

        ServiceRepository.update(service_id, {
            "title": body.get('title', srv['title']).strip(),
            "slug": body.get('slug', srv['slug']).strip(),
            "description": body.get('description', body.get('short_desc', srv.get('description', ''))),
            "icon": body.get('icon', srv.get('icon', 'car')).strip(),
            "image_url": body.get('image_url', srv.get('image_url', '')).strip(),
            "is_active": is_act,
            "display_order": display_order
        })

        AuditRepository.log(user['id'], user['username'], 'UPDATE_SERVICE', 'services', f"Updated Service {service_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Service updated."})

    @staticmethod
    def delete_service(handler, service_id: int, user: dict):
        ServiceRepository.delete(service_id)
        AuditRepository.log(user['id'], user['username'], 'DELETE_SERVICE', 'services', f"Deleted Service {service_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Service deleted."})
