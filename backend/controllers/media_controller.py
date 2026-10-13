"""
Media Library Controller
"""
import os
import re
import base64
import mimetypes
import datetime
import secrets
from urllib.parse import urlparse, parse_qs
from core.config import UPLOADS_DIR, FRONTEND_DIR
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.media_repository import MediaRepository
from repositories.audit_repository import AuditRepository

class MediaController:
    @staticmethod
    def list_media(handler):
        parsed = urlparse(handler.path)
        qs = parse_qs(parsed.query)
        cat = qs.get('category', ['ALL'])[0]
        media_list = MediaRepository.list_all(category=cat)
        return send_json(handler, {"success": True, "media": media_list})

    @staticmethod
    def upload_media(handler, user: dict):
        body = read_json_body(handler)
        filename = body.get('filename', 'upload.jpg').strip()
        data_base64 = body.get('data', '')
        category = body.get('category', 'general').strip()

        if not data_base64:
            return send_error(handler, "Missing Base64 file data", status=400)

        # Sanitize filename
        filename = os.path.basename(filename)
        filename = re.sub(r'[^a-zA-Z0-9_\.-]', '_', filename)
        ext = os.path.splitext(filename)[1].lower()
        allowed_exts = ('.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif')
        if ext not in allowed_exts:
            return send_error(handler, f"Invalid file extension {ext}. Allowed: {allowed_exts}", status=400)

        # Strip Data URL prefix if provided
        if ',' in data_base64:
            data_base64 = data_base64.split(',', 1)[1]

        try:
            file_bytes = base64.b64decode(data_base64)
        except Exception:
            return send_error(handler, "Malformed base64 payload", status=400)

        # Size check (Max 10MB)
        file_size = len(file_bytes)
        if file_size > 10 * 1024 * 1024:
            return send_error(handler, "File size exceeds 10MB limit", status=400)

        # SVG Stored XSS & XXE defense
        if ext == '.svg':
            try:
                svg_text = file_bytes.decode('utf-8', errors='ignore')
                # Neutralize dangerous scripts, foreignObject, inline event handlers, and DTD entities
                svg_text = re.sub(r'<\s*script[^>]*>.*?<\s*/\s*script\s*>', '', svg_text, flags=re.IGNORECASE | re.DOTALL)
                svg_text = re.sub(r'<\s*foreignObject[^>]*>.*?<\s*/\s*foreignObject\s*>', '', svg_text, flags=re.IGNORECASE | re.DOTALL)
                svg_text = re.sub(r'\bon\w+\s*=\s*["\'][^"\']*["\']', '', svg_text, flags=re.IGNORECASE)
                svg_text = re.sub(r'<!ENTITY[^>]*>', '', svg_text, flags=re.IGNORECASE)
                svg_text = re.sub(r'javascript\s*:', '', svg_text, flags=re.IGNORECASE)
                file_bytes = svg_text.encode('utf-8')
                file_size = len(file_bytes)
            except Exception:
                return send_error(handler, "Invalid or unparseable SVG file format.", status=400)

        mime_type = mimetypes.guess_type(filename)[0] or 'image/jpeg'
        safe_name = f"{int(datetime.datetime.now().timestamp())}_{secrets.token_hex(4)}{ext}"
        file_disk_path = os.path.join(UPLOADS_DIR, safe_name)

        with open(file_disk_path, 'wb') as f:
            f.write(file_bytes)

        # Image optimization: constrain to max 1200px and create 300px thumbnail
        thumb_name = None
        if ext in ('.jpg', '.jpeg', '.png', '.webp'):
            try:
                import subprocess
                subprocess.run(['sips', '-Z', '1200', file_disk_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
                # Create thumbnail
                base_no_ext, f_ext = os.path.splitext(safe_name)
                thumb_name = f"{base_no_ext}_thumb{f_ext}"
                thumb_disk_path = os.path.join(UPLOADS_DIR, thumb_name)
                with open(thumb_disk_path, 'wb') as f:
                    f.write(file_bytes)
                subprocess.run(['sips', '-Z', '300', thumb_disk_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
                # Update file_size after compression
                file_size = os.path.getsize(file_disk_path)
            except Exception:
                pass

        web_path = f"assets/uploads/{safe_name}"
        thumb_web_path = f"assets/uploads/{thumb_name}" if thumb_name else web_path
        m_id = MediaRepository.create(
            filename=safe_name,
            original_name=filename,
            web_path=web_path,
            mime_type=mime_type,
            file_size=file_size,
            category=category,
            uploaded_by=user['username']
        )

        AuditRepository.log(user['id'], user['username'], 'UPLOAD_MEDIA', 'media', f"Uploaded {filename} -> {web_path}", get_client_ip(handler))
        return send_json(handler, {
            "success": True,
            "id": m_id,
            "url": web_path,
            "thumbnail_url": thumb_web_path,
            "filename": safe_name,
            "original_name": filename,
            "size": file_size
        }, status=201)


    @staticmethod
    def delete_media(handler, media_id: int, user: dict):
        row = MediaRepository.get_by_id(media_id)
        if row:
            for base in (os.path.join(FRONTEND_DIR, 'public'), FRONTEND_DIR):
                file_disk = os.path.join(base, row['file_path'])
                if os.path.exists(file_disk):
                    try:
                        os.remove(file_disk)
                    except Exception:
                        pass
            MediaRepository.delete(media_id)
            AuditRepository.log(user['id'], user['username'], 'DELETE_MEDIA', 'media', f"Deleted media {media_id}", get_client_ip(handler))

        return send_json(handler, {"success": True, "message": "Media deleted."})
