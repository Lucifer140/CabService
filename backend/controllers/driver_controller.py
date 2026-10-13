"""
Driver Controller
"""
from urllib.parse import urlparse, parse_qs
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.driver_repository import DriverRepository
from repositories.audit_repository import AuditRepository

class DriverController:
    @staticmethod
    def list_drivers(handler):
        parsed = urlparse(handler.path)
        qs = parse_qs(parsed.query)
        status = qs.get('status', ['ALL'])[0]
        search = qs.get('search', [None])[0]

        drivers = DriverRepository.list_all(status=status, search=search)
        stats = DriverRepository.get_stats()
        return send_json(handler, {
            "success": True,
            "drivers": drivers,
            "stats": stats,
            "count": len(drivers)
        })

    @staticmethod
    def get_stats(handler):
        stats = DriverRepository.get_stats()
        return send_json(handler, {"success": True, "stats": stats})

    @staticmethod
    def get_driver(handler, driver_id: int):
        driver = DriverRepository.get_by_id(driver_id)
        if not driver:
            return send_error(handler, "Driver not found", status=404)
        return send_json(handler, {"success": True, "driver": driver})

    @staticmethod
    def create_driver(handler, user: dict):
        body = read_json_body(handler)
        name = body.get('name', '').strip()
        phone = body.get('phone', '').strip()
        license_no = body.get('license_no', '').strip()

        if not name or not phone or not license_no:
            return send_error(handler, "Name, phone, and license number are required.", status=400)

        existing = DriverRepository.get_by_phone(phone)
        if existing:
            return send_error(handler, f"Driver with phone number {phone} already exists.", status=409)

        driver_id = DriverRepository.create(body)
        AuditRepository.log(user['id'], user['username'], 'CREATE_DRIVER', 'drivers', f"Created driver {name} ({phone})", get_client_ip(handler))
        new_driver = DriverRepository.get_by_id(driver_id)
        return send_json(handler, {
            "success": True,
            "message": "Driver registered successfully.",
            "driver": new_driver
        }, status=201)

    @staticmethod
    def update_driver(handler, driver_id: int, user: dict):
        driver = DriverRepository.get_by_id(driver_id)
        if not driver:
            return send_error(handler, "Driver not found", status=404)

        body = read_json_body(handler)
        DriverRepository.update(driver_id, body)
        AuditRepository.log(user['id'], user['username'], 'UPDATE_DRIVER', 'drivers', f"Updated driver {driver['name']} (ID {driver_id})", get_client_ip(handler))
        updated = DriverRepository.get_by_id(driver_id)
        return send_json(handler, {
            "success": True,
            "message": "Driver updated successfully.",
            "driver": updated
        })

    @staticmethod
    def update_status(handler, driver_id: int, user: dict):
        driver = DriverRepository.get_by_id(driver_id)
        if not driver:
            return send_error(handler, "Driver not found", status=404)

        body = read_json_body(handler)
        status = body.get('status', '').strip().upper()
        if status not in ('AVAILABLE', 'ON_TRIP', 'OFFLINE'):
            return send_error(handler, "Status must be AVAILABLE, ON_TRIP, or OFFLINE.", status=400)

        DriverRepository.update_status(driver_id, status)
        AuditRepository.log(user['id'], user['username'], 'UPDATE_DRIVER_STATUS', 'drivers', f"Driver {driver['name']} status -> {status}", get_client_ip(handler))
        return send_json(handler, {
            "success": True,
            "message": f"Driver status changed to {status}."
        })

    @staticmethod
    def delete_driver(handler, driver_id: int, user: dict):
        driver = DriverRepository.get_by_id(driver_id)
        if not driver:
            return send_error(handler, "Driver not found", status=404)

        DriverRepository.delete(driver_id)
        AuditRepository.log(user['id'], user['username'], 'DELETE_DRIVER', 'drivers', f"Deleted driver {driver['name']} (ID {driver_id})", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Driver record removed."})
