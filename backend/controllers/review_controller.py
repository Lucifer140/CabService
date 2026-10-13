"""
Customer Reviews Controller
Handles public review submission & display, plus admin moderation.
"""
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.review_repository import ReviewRepository
from repositories.audit_repository import AuditRepository
from urllib.parse import urlparse, parse_qs

class ReviewController:
    @staticmethod
    def list_public_reviews(handler):
        reviews = ReviewRepository.list_approved(limit=25)
        stats = ReviewRepository.get_stats()
        return send_json(handler, {
            "success": True,
            "reviews": reviews,
            "stats": stats
        })

    @staticmethod
    def submit_review(handler):
        body = read_json_body(handler)
        name = str(body.get('customer_name', '')).strip()
        text = str(body.get('review_text', '')).strip()
        raw_rating = body.get('rating', 5)

        if not name:
            return send_error(handler, "Your name is required to post a review", status=400)
        if not text or len(text) < 5:
            return send_error(handler, "Please provide a review of at least 5 characters", status=400)

        try:
            rating = max(1, min(5, int(raw_rating)))
        except (ValueError, TypeError):
            rating = 5

        # 4 & 5 stars are auto-approved; lower ratings held for moderation
        is_approved = 1 if rating >= 4 else 0

        r_id = ReviewRepository.create({
            "customer_name": name,
            "customer_phone": str(body.get('customer_phone', '')).strip(),
            "rating": rating,
            "review_text": text,
            "trip_ref": str(body.get('trip_ref', '')).strip(),
            "route": str(body.get('route', 'Pune - Mumbai')).strip(),
            "is_approved": is_approved
        })

        return send_json(handler, {
            "success": True,
            "message": "Thank you for your valuable feedback! Your review has been submitted.",
            "id": r_id,
            "is_approved": is_approved
        }, status=201)

    @staticmethod
    def list_admin_reviews(handler):
        query = parse_qs(urlparse(handler.path).query)
        is_app = None
        if 'is_approved' in query:
            try:
                is_app = int(query['is_approved'][0])
            except (ValueError, TypeError):
                is_app = None

        reviews = ReviewRepository.list_all(is_approved=is_app, limit=100)
        stats = ReviewRepository.get_stats()
        return send_json(handler, {
            "success": True,
            "reviews": reviews,
            "stats": stats
        })

    @staticmethod
    def toggle_approve(handler, review_id: int, user: dict):
        body = read_json_body(handler)
        is_approved = 1 if body.get('is_approved', 1) in (1, '1', True, 'true') else 0
        ReviewRepository.update_approval(review_id, is_approved)
        AuditRepository.log(
            user['id'], user['username'],
            'MODERATE_REVIEW', 'reviews',
            f"Set approval to {is_approved} on review #{review_id}",
            get_client_ip(handler)
        )
        return send_json(handler, {
            "success": True,
            "message": "Review status updated.",
            "is_approved": is_approved
        })

    @staticmethod
    def delete_review(handler, review_id: int, user: dict):
        ReviewRepository.delete(review_id)
        AuditRepository.log(
            user['id'], user['username'],
            'DELETE_REVIEW', 'reviews',
            f"Deleted review #{review_id}",
            get_client_ip(handler)
        )
        return send_json(handler, {"success": True, "message": "Review removed successfully."})
