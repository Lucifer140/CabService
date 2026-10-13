"""
Fleet Management Controller
"""
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.vehicle_repository import VehicleRepository
from repositories.audit_repository import AuditRepository

class FleetController:
    @staticmethod
    def list_fleet(handler):
        vehicles = VehicleRepository.list_all(active_only=False)
        return send_json(handler, {"success": True, "vehicles": vehicles})

    @staticmethod
    def create_vehicle(handler, user: dict):
        body = read_json_body(handler)
        v_key = body.get('vehicle_key', '').strip()
        name = body.get('name', '').strip()
        if not v_key or not name:
            return send_error(handler, "Vehicle key and name are required", status=400)

        existing = VehicleRepository.get_by_key(v_key)
        if existing:
            return send_error(handler, f"Vehicle key '{v_key}' already exists", status=400)

        VehicleRepository.create({
            "vehicle_key": v_key,
            "name": name,
            "category": body.get('category', 'Sedan'),
            "passenger_capacity": int(body.get('passenger_capacity', 4)),
            "luggage_capacity": str(body.get('luggage_capacity', '2 Bags')),
            "description": body.get('description', ''),
            "image_url": body.get('image_url', ''),
            "pricing_per_km": float(body.get('pricing_per_km', 12.0)),
            "pricing_base": float(body.get('pricing_base', 2299.0)),
            "status": body.get('status', 'AVAILABLE'),
            "is_active": int(body.get('is_active', 1)),
            "display_order": int(body.get('display_order', body.get('sort_order', 0)))
        })

        AuditRepository.log(user['id'], user['username'], 'CREATE_VEHICLE', 'fleet', f"Created {name} ({v_key})", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Vehicle added to fleet."}, status=201)

    @staticmethod
    def update_vehicle(handler, vehicle_key: str, user: dict):
        body = read_json_body(handler)
        veh = VehicleRepository.get_by_key(vehicle_key)
        if not veh:
            return send_error(handler, "Vehicle not found", status=404)

        VehicleRepository.update(vehicle_key, {
            "name": body.get('name', veh['name']),
            "category": body.get('category', veh['category']),
            "passenger_capacity": int(body.get('passenger_capacity', veh['passenger_capacity'])),
            "luggage_capacity": str(body.get('luggage_capacity', veh['luggage_capacity'])),
            "description": body.get('description', veh['description']),
            "image_url": body.get('image_url', veh['image_url']),
            "pricing_per_km": float(body.get('pricing_per_km', veh['pricing_per_km'])),
            "pricing_base": float(body.get('pricing_base', veh['pricing_base'])),
            "status": body.get('status', veh.get('status', 'AVAILABLE')),
            "is_active": int(body.get('is_active', veh.get('is_active', 1))),
            "display_order": int(body.get('display_order', body.get('sort_order', veh.get('display_order', 0))))
        })

        AuditRepository.log(user['id'], user['username'], 'UPDATE_VEHICLE', 'fleet', f"Updated {vehicle_key}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Vehicle updated."})

    @staticmethod
    def delete_vehicle(handler, vehicle_key: str, user: dict):
        VehicleRepository.delete(vehicle_key)
        AuditRepository.log(user['id'], user['username'], 'DELETE_VEHICLE', 'fleet', f"Deleted {vehicle_key}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Vehicle removed."})
