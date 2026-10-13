"""
Blog Posts Repository
Handles database operations for SEO articles and content marketing.
"""
import re
from repositories.base_repository import BaseRepository

class BlogRepository(BaseRepository):
    @classmethod
    def list_published(cls, category: str = None, limit: int = 50, offset: int = 0) -> list:
        params = []
        sql = """
            SELECT id, title, slug, excerpt, featured_image, author, category, tags,
                   views_count, created_at, updated_at
            FROM blog_posts
            WHERE is_published = 1
        """
        if category and category.strip():
            sql += " AND LOWER(category) = LOWER(?)"
            params.append(category.strip())

        sql += " ORDER BY id DESC LIMIT ? OFFSET ?;"
        params.extend([limit, offset])
        return cls.query(sql, tuple(params))

    @classmethod
    def list_all_admin(cls) -> list:
        sql = """
            SELECT id, title, slug, excerpt, featured_image, author, category, tags,
                   is_published, views_count, created_at, updated_at
            FROM blog_posts
            ORDER BY id DESC;
        """
        return cls.query(sql)

    @classmethod
    def get_by_id(cls, post_id: int) -> dict:
        sql = "SELECT * FROM blog_posts WHERE id = ?;"
        return cls.query_one(sql, (post_id,))

    @classmethod
    def get_by_slug(cls, slug: str, published_only: bool = True) -> dict:
        sql = "SELECT * FROM blog_posts WHERE slug = ?"
        params = [slug.strip().lower()]
        if published_only:
            sql += " AND is_published = 1"
        sql += ";"
        return cls.query_one(sql, tuple(params))

    @classmethod
    def increment_views(cls, post_id: int):
        sql = "UPDATE blog_posts SET views_count = views_count + 1 WHERE id = ?;"
        cls.execute(sql, (post_id,))

    @staticmethod
    def slugify(text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[\s_-]+', '-', text)
        return text.strip('-')

    @classmethod
    def create(cls, data: dict) -> int:
        title = data.get('title', '').strip()
        slug = data.get('slug', '').strip()
        if not slug and title:
            slug = cls.slugify(title)

        sql = """
            INSERT INTO blog_posts (title, slug, content_html, excerpt, featured_image, author, category, tags, is_published, views_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        return cls.execute(sql, (
            title,
            slug.lower(),
            data.get('content_html', '').strip(),
            data.get('excerpt', '').strip(),
            data.get('featured_image', '').strip(),
            data.get('author', 'Sangita Travels Editorial').strip(),
            data.get('category', 'Route Guide').strip(),
            data.get('tags', '').strip(),
            int(data.get('is_published', 1)),
            int(data.get('views_count', 0))
        ))

    @classmethod
    def update(cls, post_id: int, data: dict):
        title = data.get('title', '').strip()
        slug = data.get('slug', '').strip()
        if not slug and title:
            slug = cls.slugify(title)

        sql = """
            UPDATE blog_posts
            SET title = ?, slug = ?, content_html = ?, excerpt = ?, featured_image = ?,
                author = ?, category = ?, tags = ?, is_published = ?,
                updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (
            title,
            slug.lower(),
            data.get('content_html', '').strip(),
            data.get('excerpt', '').strip(),
            data.get('featured_image', '').strip(),
            data.get('author', 'Sangita Travels Editorial').strip(),
            data.get('category', 'Route Guide').strip(),
            data.get('tags', '').strip(),
            int(data.get('is_published', 1)),
            post_id
        ))

    @classmethod
    def delete(cls, post_id: int):
        sql = "DELETE FROM blog_posts WHERE id = ?;"
        cls.execute(sql, (post_id,))
