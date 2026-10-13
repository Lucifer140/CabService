"""
SEO Metadata Repository
"""
from repositories.base_repository import BaseRepository

class SeoRepository(BaseRepository):
    @classmethod
    def get_all(cls) -> list:
        return cls.query("SELECT *, page_key AS page_identifier FROM seo_meta ORDER BY page_key ASC;")

    @classmethod
    def get_by_page(cls, page_key: str) -> dict:
        return cls.query_one("SELECT *, page_key AS page_identifier FROM seo_meta WHERE page_key = ?;", (page_key,))

    @classmethod
    def update_page(cls, page_key: str, data: dict):
        sql = """
            INSERT INTO seo_meta (page_key, title, meta_description, keywords, og_title, og_description, og_image, canonical_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(page_key) DO UPDATE SET
                title = excluded.title,
                meta_description = excluded.meta_description,
                keywords = excluded.keywords,
                og_title = excluded.og_title,
                og_description = excluded.og_description,
                og_image = excluded.og_image,
                canonical_url = excluded.canonical_url,
                updated_at = datetime('now');
        """
        cls.execute(sql, (
            page_key,
            data.get('title', ''),
            data.get('meta_description', ''),
            data.get('keywords', ''),
            data.get('og_title', ''),
            data.get('og_description', ''),
            data.get('og_image', ''),
            data.get('canonical_url', '')
        ))
