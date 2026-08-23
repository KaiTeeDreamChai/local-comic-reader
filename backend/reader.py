import io
import os
import zipfile
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import pymupdf as fitz

from .utils import (
    IMAGE_EXTENSIONS,
    ARCHIVE_EXTENSIONS,
    PDF_EXTENSIONS,
    natural_sort_key,
    encode_path
)

CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def get_cache_path(key: str, ext: str = ".webp") -> Path:
    hash_key = hashlib.md5(key.encode('utf-8')).hexdigest()
    sub_dir = CACHE_DIR / hash_key[:2]
    sub_dir.mkdir(parents=True, exist_ok=True)
    return sub_dir / f"{hash_key}{ext}"


class ComicReader:
    @staticmethod
    def get_comic_info(path_str: str) -> Dict[str, Any]:
        """Inspect a file or folder and return its comic structure (pages list, type, total)."""
        target = Path(path_str)
        if not target.exists():
            raise FileNotFoundError(f"Target not found: {path_str}")

        encoded_comic_path = encode_path(str(target.resolve()))

        # Case 1: PDF Document
        if target.is_file() and target.suffix.lower() in PDF_EXTENSIONS:
            try:
                doc = fitz.open(str(target))
                page_count = len(doc)
                doc.close()
                pages = [
                    {
                        "page_index": i,
                        "page_name": f"Page {i + 1}",
                        "url": f"/api/comic/page?comic_id={encoded_comic_path}&page_index={i}",
                        "thumbnail_url": f"/api/comic/thumbnail?comic_id={encoded_comic_path}&page_index={i}"
                    }
                    for i in range(page_count)
                ]
                return {
                    "id": encoded_comic_path,
                    "title": target.stem,
                    "type": "pdf",
                    "path": str(target),
                    "total_pages": page_count,
                    "pages": pages,
                    "cover_url": f"/api/comic/thumbnail?comic_id={encoded_comic_path}&page_index=0" if page_count > 0 else None
                }
            except Exception as e:
                raise ValueError(f"Failed to read PDF: {e}")

        # Case 2: Zip / CBZ Archive
        if target.is_file() and target.suffix.lower() in ARCHIVE_EXTENSIONS:
            try:
                with zipfile.ZipFile(str(target), 'r') as zf:
                    all_names = zf.namelist()
                    # Filter for image files, ignoring macOS metadata __MACOSX/ or hidden files
                    img_names = [
                        n for n in all_names
                        if not n.startswith("__MACOSX/") and not Path(n).name.startswith(".")
                        and Path(n).suffix.lower() in IMAGE_EXTENSIONS
                    ]
                    img_names.sort(key=natural_sort_key)
                    pages = [
                        {
                            "page_index": i,
                            "page_name": Path(name).name,
                            "internal_path": name,
                            "url": f"/api/comic/page?comic_id={encoded_comic_path}&page_index={i}",
                            "thumbnail_url": f"/api/comic/thumbnail?comic_id={encoded_comic_path}&page_index=0"
                        }
                        for i, name in enumerate(img_names)
                    ]
                    return {
                        "id": encoded_comic_path,
                        "title": target.stem,
                        "type": "archive",
                        "path": str(target),
                        "total_pages": len(pages),
                        "pages": pages,
                        "cover_url": f"/api/comic/thumbnail?comic_id={encoded_comic_path}&page_index=0" if len(pages) > 0 else None
                    }
            except Exception as e:
                raise ValueError(f"Failed to read Archive: {e}")

        # Case 3: Image Folder
        if target.is_dir():
            img_files = []
            try:
                for entry in target.iterdir():
                    if entry.is_file() and entry.suffix.lower() in IMAGE_EXTENSIONS and not entry.name.startswith("."):
                        img_files.append(entry)
            except Exception as e:
                raise ValueError(f"Failed to read Directory: {e}")

            img_files.sort(key=lambda x: natural_sort_key(x.name))
            pages = [
                {
                    "page_index": i,
                    "page_name": img_path.name,
                    "url": f"/api/comic/page?comic_id={encoded_comic_path}&page_index={i}",
                    "thumbnail_url": f"/api/comic/thumbnail?comic_id={encoded_comic_path}&page_index={i}"
                }
                for i, img_path in enumerate(img_files)
            ]
            return {
                "id": encoded_comic_path,
                "title": target.name,
                "type": "folder",
                "path": str(target),
                "total_pages": len(pages),
                "pages": pages,
                "cover_url": f"/api/comic/thumbnail?comic_id={encoded_comic_path}&page_index=0" if len(pages) > 0 else None
            }

        raise ValueError(f"Unsupported comic format for path: {path_str}")

    @staticmethod
    def get_page_bytes(path_str: str, page_index: int) -> Tuple[bytes, str]:
        """Return (image_bytes, media_type) for a specific page."""
        target = Path(path_str)
        if not target.exists():
            raise FileNotFoundError("Comic target not found")

        # PDF page rendering
        if target.is_file() and target.suffix.lower() in PDF_EXTENSIONS:
            doc = fitz.open(str(target))
            if page_index < 0 or page_index >= len(doc):
                doc.close()
                raise IndexError(f"Page index {page_index} out of range (0-{len(doc)-1})")
            page = doc.load_page(page_index)
            # Render at 2.0 zoom (144 DPI) for crisp high-DPI / Retina reading
            zoom = 2.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img_bytes = pix.tobytes("jpeg")
            doc.close()
            return img_bytes, "image/jpeg"

        # Archive (Zip/CBZ) page extraction
        if target.is_file() and target.suffix.lower() in ARCHIVE_EXTENSIONS:
            with zipfile.ZipFile(str(target), 'r') as zf:
                all_names = zf.namelist()
                img_names = [
                    n for n in all_names
                    if not n.startswith("__MACOSX/") and not Path(n).name.startswith(".")
                    and Path(n).suffix.lower() in IMAGE_EXTENSIONS
                ]
                img_names.sort(key=natural_sort_key)
                if page_index < 0 or page_index >= len(img_names):
                    raise IndexError(f"Page index {page_index} out of range (0-{len(img_names)-1})")
                entry_name = img_names[page_index]
                data = zf.read(entry_name)
                ext = Path(entry_name).suffix.lower()
                media_type = "image/jpeg"
                if ext == ".png":
                    media_type = "image/png"
                elif ext == ".webp":
                    media_type = "image/webp"
                elif ext == ".gif":
                    media_type = "image/gif"
                elif ext == ".avif":
                    media_type = "image/avif"
                return data, media_type

        # Folder images
        if target.is_dir():
            img_files = [
                entry for entry in target.iterdir()
                if entry.is_file() and entry.suffix.lower() in IMAGE_EXTENSIONS and not entry.name.startswith(".")
            ]
            img_files.sort(key=lambda x: natural_sort_key(x.name))
            if page_index < 0 or page_index >= len(img_files):
                raise IndexError(f"Page index {page_index} out of range (0-{len(img_files)-1})")
            img_file = img_files[page_index]
            with open(img_file, "rb") as f:
                data = f.read()
            ext = img_file.suffix.lower()
            media_type = "image/jpeg"
            if ext == ".png":
                media_type = "image/png"
            elif ext == ".webp":
                media_type = "image/webp"
            elif ext == ".gif":
                media_type = "image/gif"
            elif ext == ".avif":
                media_type = "image/avif"
            return data, media_type

        raise ValueError("Unsupported format")

    @staticmethod
    def get_thumbnail_bytes(path_str: str, page_index: int = 0, max_size: int = 360) -> Tuple[bytes, str]:
        """Generate and cache a thumbnail for fast loading."""
        mtime = os.path.getmtime(path_str) if os.path.exists(path_str) else 0
        cache_key = f"{path_str}:{mtime}:{page_index}:{max_size}"
        cache_file = get_cache_path(cache_key, ext=".webp")

        if cache_file.exists():
            with open(cache_file, "rb") as f:
                return f.read(), "image/webp"

        # Generate on the fly
        raw_bytes, _ = ComicReader.get_page_bytes(path_str, page_index)
        
        try:
            with Image.open(io.BytesIO(raw_bytes)) as im:
                # Convert palette/RGBA modes to RGB for consistent webp output
                if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
                    alpha = im.convert('RGBA')
                    bg = Image.new('RGBA', alpha.size, (255, 255, 255))
                    bg.paste(alpha, mask=alpha)
                    im = bg.convert('RGB')
                elif im.mode != 'RGB':
                    im = im.convert('RGB')

                im.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                output = io.BytesIO()
                im.save(output, format="WEBP", quality=82)
                thumb_bytes = output.getvalue()

                # Save to disk cache
                with open(cache_file, "wb") as f:
                    f.write(thumb_bytes)

                return thumb_bytes, "image/webp"
        except Exception as e:
            print(f"Thumbnail generation error: {e}")
            return raw_bytes, "image/jpeg"

    @staticmethod
    def get_optimized_page_bytes(path_str: str, page_index: int, max_dimension: int = 2048, quality: int = 82) -> Tuple[bytes, str]:
        """
        Weak network optimization:
        Compresses image into optimized WebP with lanczos scaling (max 2048px)
        and caches on disk for zero-latency subsequent delivery.
        """
        mtime = os.path.getmtime(path_str) if os.path.exists(path_str) else 0
        cache_key = f"opt:{path_str}:{mtime}:{page_index}:{max_dimension}:{quality}"
        cache_file = get_cache_path(cache_key, ext=".webp")

        if cache_file.exists():
            with open(cache_file, "rb") as f:
                return f.read(), "image/webp"

        raw_bytes, _ = ComicReader.get_page_bytes(path_str, page_index)

        try:
            with Image.open(io.BytesIO(raw_bytes)) as im:
                if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
                    alpha = im.convert('RGBA')
                    bg = Image.new('RGBA', alpha.size, (255, 255, 255))
                    bg.paste(alpha, mask=alpha)
                    im = bg.convert('RGB')
                elif im.mode != 'RGB':
                    im = im.convert('RGB')

                # Resize if larger than max_dimension
                w, h = im.size
                if max(w, h) > max_dimension:
                    im.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

                output = io.BytesIO()
                im.save(output, format="WEBP", quality=quality, method=4)
                opt_bytes = output.getvalue()

                # Cache to disk
                with open(cache_file, "wb") as f:
                    f.write(opt_bytes)

                return opt_bytes, "image/webp"
        except Exception as e:
            print(f"Optimization fallback: {e}")
            return raw_bytes, "image/jpeg"

