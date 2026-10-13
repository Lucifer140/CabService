"""
Blog & Content Marketing Controller
"""
from urllib.parse import urlparse, parse_qs
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.blog_repository import BlogRepository
from repositories.audit_repository import AuditRepository

class BlogController:
    @staticmethod
    def list_public_posts(handler):
        parsed = urlparse(handler.path)
        qs = parse_qs(parsed.query)
        category = qs.get('category', [None])[0]
        limit = int(qs.get('limit', [50])[0])
        offset = int(qs.get('offset', [0])[0])

        posts = BlogRepository.list_published(category=category, limit=limit, offset=offset)
        return send_json(handler, {
            "success": True,
            "posts": posts,
            "count": len(posts)
        })

    @staticmethod
    def get_public_post(handler, slug: str):
        if not slug:
            return send_error(handler, "Article slug is required.", status=400)

        post = BlogRepository.get_by_slug(slug, published_only=True)
        if not post:
            return send_error(handler, f"Article '{slug}' not found.", status=404)

        # Track reading view
        try:
            BlogRepository.increment_views(post['id'])
            post['views_count'] = (post.get('views_count') or 0) + 1
        except Exception:
            pass

        return send_json(handler, {
            "success": True,
            "post": post
        })

    @staticmethod
    def list_admin_posts(handler):
        posts = BlogRepository.list_all_admin()
        return send_json(handler, {
            "success": True,
            "posts": posts,
            "count": len(posts)
        })

    @staticmethod
    def get_admin_post(handler, post_id: int):
        post = BlogRepository.get_by_id(post_id)
        if not post:
            return send_error(handler, "Article not found.", status=404)
        return send_json(handler, {
            "success": True,
            "post": post
        })

    @staticmethod
    def create_post(handler, user: dict):
        body = read_json_body(handler)
        title = body.get('title', '').strip()
        content_html = body.get('content_html', '').strip()

        if not title:
            return send_error(handler, "Article title is required.", status=400)
        if not content_html:
            return send_error(handler, "Article content is required.", status=400)

        slug = body.get('slug', '').strip() or BlogRepository.slugify(title)
        existing = BlogRepository.get_by_slug(slug, published_only=False)
        if existing:
            return send_error(handler, f"An article with slug '{slug}' already exists.", status=409)

        body['slug'] = slug
        post_id = BlogRepository.create(body)
        AuditRepository.log(user['id'], user['username'], 'CREATE_BLOG_POST', 'blog_posts', f"Created post '{title}' (ID {post_id})", get_client_ip(handler))
        new_post = BlogRepository.get_by_id(post_id)
        return send_json(handler, {
            "success": True,
            "message": f"Article '{title}' published successfully.",
            "post": new_post
        }, status=201)

    @staticmethod
    def update_post(handler, post_id: int, user: dict):
        post = BlogRepository.get_by_id(post_id)
        if not post:
            return send_error(handler, "Article not found.", status=404)

        body = read_json_body(handler)
        title = body.get('title', post['title']).strip()
        if not title:
            return send_error(handler, "Article title cannot be empty.", status=400)

        slug = body.get('slug', '').strip() or BlogRepository.slugify(title)
        existing = BlogRepository.get_by_slug(slug, published_only=False)
        if existing and existing['id'] != post_id:
            return send_error(handler, f"An article with slug '{slug}' already exists.", status=409)

        body['slug'] = slug
        if 'content_html' not in body:
            body['content_html'] = post['content_html']

        BlogRepository.update(post_id, body)
        AuditRepository.log(user['id'], user['username'], 'UPDATE_BLOG_POST', 'blog_posts', f"Updated post '{title}' (ID {post_id})", get_client_ip(handler))
        updated = BlogRepository.get_by_id(post_id)
        return send_json(handler, {
            "success": True,
            "message": "Article updated successfully.",
            "post": updated
        })

    @staticmethod
    def delete_post(handler, post_id: int, user: dict):
        post = BlogRepository.get_by_id(post_id)
        if not post:
            return send_error(handler, "Article not found.", status=404)

        BlogRepository.delete(post_id)
        AuditRepository.log(user['id'], user['username'], 'DELETE_BLOG_POST', 'blog_posts', f"Deleted post '{post['title']}' (ID {post_id})", get_client_ip(handler))
        return send_json(handler, {
            "success": True,
            "message": f"Article '{post['title']}' deleted successfully."
        })
