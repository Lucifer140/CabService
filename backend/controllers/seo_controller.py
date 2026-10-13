"""
SEO & Sitemap Controller
Dynamically generates sitemap.xml with live tour, service, and content routes
and handles SEO metadata queries.
"""

from datetime import datetime, timezone
from repositories.tour_repository import TourRepository
from repositories.service_repository import ServiceRepository
from repositories.seo_repository import SeoRepository
from core.response import apply_security_headers

BASE_URL = "https://sangitatravelspune.com"

class SeoController:
    @staticmethod
    def get_sitemap(handler):
        """Generates real-time, dynamic sitemap.xml."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        tours = TourRepository.list_all(active_only=True)
        services = ServiceRepository.list_all(active_only=True)

        urls = [
            {"loc": f"{BASE_URL}/", "priority": "1.0", "changefreq": "daily"},
            {"loc": f"{BASE_URL}/#/about", "priority": "0.8", "changefreq": "monthly"},
            {"loc": f"{BASE_URL}/#/contact", "priority": "0.8", "changefreq": "monthly"},
            {"loc": f"{BASE_URL}/#/faq", "priority": "0.8", "changefreq": "monthly"},
            {"loc": f"{BASE_URL}/#/track-booking", "priority": "0.7", "changefreq": "weekly"},
        ]

        # Dynamic Tour Pages
        for tour in tours:
            slug = tour.get('slug')
            if slug:
                urls.append({
                    "loc": f"{BASE_URL}/#/tours/{slug}",
                    "priority": "0.9",
                    "changefreq": "weekly"
                })

        # Dynamic Services
        for svc in services:
            slug = svc.get('slug')
            if slug:
                urls.append({
                    "loc": f"{BASE_URL}/#/services/{slug}",
                    "priority": "0.8",
                    "changefreq": "monthly"
                })

        xml_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        ]

        for u in urls:
            xml_lines.append("  <url>")
            xml_lines.append(f"    <loc>{u['loc']}</loc>")
            xml_lines.append(f"    <lastmod>{today}</lastmod>")
            xml_lines.append(f"    <changefreq>{u['changefreq']}</changefreq>")
            xml_lines.append(f"    <priority>{u['priority']}</priority>")
            xml_lines.append("  </url>")

        xml_lines.append("</urlset>")
        body = "\n".join(xml_lines).encode("utf-8")

        handler.send_response(200)
        handler.send_header("Content-Type", "application/xml; charset=utf-8")
        handler.send_header("Content-Length", str(len(body)))
        handler.send_header("Cache-Control", "public, max-age=86400")
        apply_security_headers(handler)
        handler.end_headers()
        handler.wfile.write(body)

    @staticmethod
    def get_robots(handler):
        content = (
            "User-agent: *\n"
            "Allow: /\n"
            "Disallow: /admin\n"
            "Disallow: /api/\n"
            "Disallow: /login.html\n\n"
            f"Sitemap: {BASE_URL}/sitemap.xml\n"
        ).encode("utf-8")

        handler.send_response(200)
        handler.send_header("Content-Type", "text/plain; charset=utf-8")
        handler.send_header("Content-Length", str(len(content)))
        apply_security_headers(handler)
        handler.end_headers()
        handler.wfile.write(content)
