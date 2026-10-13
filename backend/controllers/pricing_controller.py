"""
Pricing Rules Controller
"""
from urllib.parse import urlparse, parse_qs
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.pricing_repository import PricingRepository
from repositories.audit_repository import AuditRepository
from services.maps_service import MapsService

class PricingController:
    @staticmethod
    def list_pricing(handler):
        rules = PricingRepository.list_all()
        return send_json(handler, {"success": True, "rules": rules})

    @staticmethod
    def calculate_route(handler):
        parsed = urlparse(handler.path)
        qs = parse_qs(parsed.query)
        pickup = qs.get('pickup', [''])[0].strip()
        drop = qs.get('drop', [''])[0].strip()

        if not pickup or not drop:
            return send_error(handler, "Pickup and drop locations are required", status=400)

        if pickup.lower() == drop.lower():
            return send_error(handler, "Pickup and drop locations cannot be identical", status=400)

        route_info = MapsService.calculate_distance(pickup, drop)
        return send_json(handler, {"success": True, "route": route_info})

    @staticmethod
    def calculate_fare(handler):
        body = read_json_body(handler)
        pickup = (body.get('pickup') or body.get('pickup_location') or '').strip()
        drop = (body.get('drop') or body.get('drop_location') or '').strip()
        vehicle_key = (body.get('vehicle') or body.get('vehicle_key') or 'dzire').lower()
        trip_type = (body.get('trip_type') or body.get('tripType') or 'oneway').lower()

        if not pickup or not drop:
            return send_error(handler, "Pickup and drop locations are required", status=400)

        if pickup.lower() == drop.lower():
            return send_error(handler, "Pickup and drop locations cannot be identical", status=400)

        # Find pricing rule
        rule = PricingRepository.get_by_vehicle_key(vehicle_key)
        if not rule:
            rules = PricingRepository.list_all()
            rule = rules[0] if rules else {
                "vehicle_key": vehicle_key,
                "vehicle_name": vehicle_key.upper(),
                "per_km": 12.0,
                "min_km": 130,
                "driver_allowance": 300,
                "oneway_pune_mumbai": 2299,
                "roundtrip_base": 4500,
                "airport_rate": 2299
            }

        breakdown = MapsService.compute_fare_breakdown(pickup, drop, rule, trip_type=trip_type)
        return send_json(handler, {"success": True, "pricing": breakdown})


    @staticmethod
    def create_pricing(handler, user: dict):
        body = read_json_body(handler)
        v_key = body.get('vehicle_key', '').strip()
        v_name = body.get('vehicle_name', '').strip()
        if not v_key or not v_name:
            return send_error(handler, "Vehicle key and name are required", status=400)

        r_id = PricingRepository.create({
            "vehicle_key": v_key,
            "vehicle_name": v_name,
            "per_km": float(body.get('per_km', 12.0)),
            "min_km": int(body.get('min_km', 130)),
            "driver_allowance": float(body.get('driver_allowance', 300.0)),
            "oneway_pune_mumbai": float(body.get('oneway_pune_mumbai', 2299.0)),
            "roundtrip_base": float(body.get('roundtrip_base', 4500.0)),
            "airport_rate": float(body.get('airport_rate', 2299.0)),
            "show_price_public": int(body.get('show_price_public', 0))
        })

        AuditRepository.log(user['id'], user['username'], 'CREATE_PRICING', 'pricing', f"Created pricing for {v_name}", get_client_ip(handler))
        return send_json(handler, {"success": True, "id": r_id, "message": "Pricing rule created."}, status=201)

    @staticmethod
    def update_pricing(handler, rule_id: int, user: dict):
        body = read_json_body(handler)
        rule = PricingRepository.get_by_id(rule_id)
        if not rule:
            return send_error(handler, "Pricing rule not found", status=404)

        PricingRepository.update(rule_id, {
            "vehicle_key": body.get('vehicle_key', rule['vehicle_key']),
            "vehicle_name": body.get('vehicle_name', rule['vehicle_name']),
            "per_km": float(body.get('per_km', rule['per_km'])),
            "min_km": int(body.get('min_km', rule['min_km'])),
            "driver_allowance": float(body.get('driver_allowance', rule['driver_allowance'])),
            "oneway_pune_mumbai": float(body.get('oneway_pune_mumbai', rule['oneway_pune_mumbai'])),
            "roundtrip_base": float(body.get('roundtrip_base', rule['roundtrip_base'])),
            "airport_rate": float(body.get('airport_rate', rule['airport_rate'])),
            "show_price_public": int(body.get('show_price_public', rule['show_price_public']))
        })

        AuditRepository.log(user['id'], user['username'], 'UPDATE_PRICING', 'pricing', f"Updated pricing rule {rule_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Pricing rule updated."})

    @staticmethod
    def delete_pricing(handler, rule_id: int, user: dict):
        PricingRepository.delete(rule_id)
        AuditRepository.log(user['id'], user['username'], 'DELETE_PRICING', 'pricing', f"Deleted pricing rule {rule_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Pricing rule deleted."})
