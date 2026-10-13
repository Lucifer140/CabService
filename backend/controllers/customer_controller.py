"""
Customer CRM Controller
"""
from urllib.parse import urlparse, parse_qs
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.customer_repository import CustomerRepository
from repositories.audit_repository import AuditRepository

class CustomerController:
    @staticmethod
    def list_customers(handler):
        parsed = urlparse(handler.path)
        qs = parse_qs(parsed.query)
        search = qs.get('search', [''])[0]
        customers = CustomerRepository.list_all(search=search)
        return send_json(handler, {"success": True, "customers": customers, "count": len(customers)})

    @staticmethod
    def get_customer(handler, customer_id: int):
        c = CustomerRepository.get_by_id(customer_id)
        if not c:
            return send_error(handler, "Customer not found", status=404)
        return send_json(handler, {"success": True, "customer": c})

    @staticmethod
    def update_customer(handler, customer_id: int, user: dict):
        body = read_json_body(handler)
        name = body.get('name', '').strip()
        email = body.get('email', '').strip()
        notes = body.get('notes', '').strip()

        CustomerRepository.update(customer_id, name, email, notes)
        AuditRepository.log(user['id'], user['username'], 'UPDATE_CUSTOMER', 'customers', f"Updated customer {customer_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Customer updated."})
