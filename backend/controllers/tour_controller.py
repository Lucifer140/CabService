"""
Tour Packages Controller
"""
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.tour_repository import TourRepository
from repositories.audit_repository import AuditRepository

class TourController:
    @staticmethod
    def list_tours(handler):
        tours = TourRepository.list_all(active_only=False)
        return send_json(handler, {"success": True, "tours": tours})

    @staticmethod
    def get_tour_by_slug(handler, slug: str):
        tour = TourRepository.get_by_slug(slug)
        if not tour:
            return send_error(handler, "Tour not found", status=404)
        return send_json(handler, {"success": True, "tour": tour})

    @staticmethod
    def create_tour(handler, user: dict):
        body = read_json_body(handler)
        title = body.get('title', '').strip()
        destination = body.get('destination', '').strip()
        if not title:
            return send_error(handler, "Tour title is required", status=400)

        slug = body.get('slug', '').strip() or title.lower().replace(' ', '-')
        raw_p = body.get('price') if 'price' in body else body.get('starting_price')
        if raw_p is not None and str(raw_p).strip() != '':
            try:
                price = float(raw_p)
            except (ValueError, TypeError):
                price = None
        else:
            price = None

        if 'is_published' in body:
            is_pub = 1 if body['is_published'] in (1, '1', True, 'true', 'TRUE') else 0
        elif 'is_active' in body:
            is_pub = 1 if body['is_active'] in (1, '1', True, 'true', 'TRUE') else 0
        else:
            is_pub = 1

        raw_order = body.get('display_order') if 'display_order' in body else body.get('sort_order', 0)
        try:
            display_order = int(raw_order) if raw_order is not None else 0
        except (ValueError, TypeError):
            display_order = 0

        t_id = TourRepository.create({
            "title": title,
            "slug": slug,
            "destination": destination,
            "duration": body.get('duration', '1 Day').strip(),
            "itinerary": body.get('itinerary', body.get('description', '')),
            "inclusions": body.get('inclusions', ''),
            "exclusions": body.get('exclusions', ''),
            "price": price,
            "cover_image": body.get('cover_image', body.get('image_url', '')),
            "is_published": is_pub,
            "display_order": display_order
        })

        AuditRepository.log(user['id'], user['username'], 'CREATE_TOUR', 'tours', f"Created {title}", get_client_ip(handler))
        return send_json(handler, {"success": True, "id": t_id, "message": "Tour created."}, status=201)

    @staticmethod
    def update_tour(handler, tour_id: int, user: dict):
        body = read_json_body(handler)
        tour = TourRepository.get_by_id(tour_id)
        if not tour:
            return send_error(handler, "Tour not found", status=404)

        if 'price' in body or 'starting_price' in body:
            raw_p = body.get('price') if 'price' in body else body.get('starting_price')
            if raw_p is None or str(raw_p).strip() == '':
                price = None
            else:
                try:
                    price = float(raw_p)
                except (ValueError, TypeError):
                    price = None
        else:
            price = tour.get('price')

        if 'is_published' in body:
            is_pub = 1 if body['is_published'] in (1, '1', True, 'true', 'TRUE') else 0
        elif 'is_active' in body:
            is_pub = 1 if body['is_active'] in (1, '1', True, 'true', 'TRUE') else 0
        else:
            is_pub = tour.get('is_published', 1)

        if 'display_order' in body or 'sort_order' in body:
            raw_order = body.get('display_order') if 'display_order' in body else body.get('sort_order')
            try:
                display_order = int(raw_order) if raw_order is not None else 0
            except (ValueError, TypeError):
                display_order = 0
        else:
            display_order = tour.get('display_order', 0)

        TourRepository.update(tour_id, {
            "title": body.get('title', tour['title']),
            "slug": body.get('slug', tour['slug']),
            "destination": body.get('destination', tour['destination']),
            "duration": body.get('duration', tour['duration']),
            "itinerary": body.get('itinerary', tour.get('itinerary', '')),
            "inclusions": body.get('inclusions', tour.get('inclusions', '')),
            "exclusions": body.get('exclusions', tour.get('exclusions', '')),
            "price": price,
            "cover_image": body.get('cover_image', tour.get('cover_image', '')),
            "is_published": is_pub,
            "display_order": display_order
        })

        AuditRepository.log(user['id'], user['username'], 'UPDATE_TOUR', 'tours', f"Updated tour {tour_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Tour updated."})

    @staticmethod
    def delete_tour(handler, tour_id: int, user: dict):
        TourRepository.delete(tour_id)
        AuditRepository.log(user['id'], user['username'], 'DELETE_TOUR', 'tours', f"Deleted tour {tour_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Tour removed."})
