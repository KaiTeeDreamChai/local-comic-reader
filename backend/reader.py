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
    VIDEO_EXTENSIONS,
    BOOK_EXTENSIONS,
    natural_sort_key,
    encode_path
)
from .novel import NovelParser

CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# High-speed in-memory thumbnail and info cache (avoids disk IO for frequently browsed covers)
_MEM_THUMB_CACHE: Dict[str, Tuple[bytes, str]] = {}
_MAX_MEM_CACHE_ITEMS = 500


def get_cache_path(key: str, ext: str = ".webp") -> Path:
    hash_key = hashlib.md5(key.encode('utf-8')).hexdigest()
    sub_dir = CACHE_DIR / hash_key[:2]
    sub_dir.mkdir(parents=True, exist_ok=True)
    return sub_dir / f"{hash_key}{ext}"


def extract_video_first_frame(video_path: Path) -> Optional[bytes]:
    """Extract first frame of a video using ffmpeg CLI or fallback with disk caching."""
    mtime = os.path.getmtime(video_path) if video_path.exists() else 0
    cache_key = f"vframe:{video_path}:{mtime}"
    cache_file = get_cache_path(cache_key, ext=".jpg")

    if cache_file.exists():
        try:
            with open(cache_file, "rb") as f:
                return f.read()
        except Exception:
            pass

    import subprocess
    import shutil

    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        for p in ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg", "ffmpeg.exe", r"C:\ffmpeg\bin\ffmpeg.exe"]:
            if os.path.exists(p):
                ffmpeg_bin = p
                break

    frame_data = None
    if ffmpeg_bin:
        try:
            cmd = [
                ffmpeg_bin,
                "-ss", "00:00:01",
                "-i", str(video_path),
                "-vframes", "1",
                "-f", "image2pipe",
                "-vcodec", "mjpeg",
                "-"
            ]
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
            out, _ = proc.communicate(timeout=3)
            if out and len(out) > 500:
                frame_data = out
        except Exception as e:
            print(f"ffmpeg frame extract failed: {e}")

    if not frame_data:
        # Fallback: create a stylish video placeholder image with PIL
        try:
            from PIL import ImageDraw
            img = Image.new("RGB", (640, 360), color=(24, 24, 27))
            draw = ImageDraw.Draw(img)
            draw.polygon([(290, 150), (290, 210), (350, 180)], fill=(59, 130, 246))
            ext_text = video_path.suffix.upper()[1:]
            draw.text((320, 240), f"{ext_text} VIDEO", fill=(161, 161, 170), anchor="mm")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            frame_data = buf.getvalue()
        except Exception:
            return None

    if frame_data:
        try:
            with open(cache_file, "wb") as f:
                f.write(frame_data)
        except Exception:
            pass

    return frame_data


class ComicReader:
    @staticmethod
    def get_comic_info(path_str: str) -> Dict[str, Any]:
        """Inspect a file or folder and return its structure (pages list, type, total)."""
        target = Path(path_str)
        if not target.exists():
            raise FileNotFoundError(f"Target not found: {path_str}")

        encoded_comic_path = encode_path(str(target.resolve()))

        # Case 0: Book / Novel / Ebook File
        if target.is_file() and target.suffix.lower() in BOOK_EXTENSIONS:
            book_data = NovelParser.parse_book(str(target))
            return {
                "id": encoded_comic_path,
                "title": book_data["title"],
                "type": "book",
                "format": book_data["format"],
                "path": str(target),
                "total_pages": book_data["total_chapters"],
                "total_chapters": book_data["total_chapters"],
                "total_words": book_data["total_words"],
                "chapters": book_data["chapters"],
                "cover_url": f"/api/comic/thumbnail?comic_id={encoded_comic_path}&page_index=0",
                "is_book": True
            }

        # Case 0.5: Video Media File
        if target.is_file() and target.suffix.lower() in VIDEO_EXTENSIONS:
            pages = [
                {
                    "page_index": 0,
                    "page_name": target.name,
                    "url": f"/api/video/stream?comic_id={encoded_comic_path}",
                    "thumbnail_url": f"/api/comic/thumbnail?comic_id={encoded_comic_path}&page_index=0",
                    "is_video": True
                }
            ]
            return {
                "id": encoded_comic_path,
                "title": target.stem,
                "type": "video",
                "path": str(target),
                "total_pages": 1,
                "pages": pages,
                "cover_url": f"/api/comic/thumbnail?comic_id={encoded_comic_path}&page_index=0",
                "video_url": f"/api/video/stream?comic_id={encoded_comic_path}",
                "is_video": True
            }

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

        # Ebook cover generation
        if target.is_file() and target.suffix.lower() in BOOK_EXTENSIONS:
            fmt = target.suffix.lower()[1:]
            cover_bytes = NovelParser.generate_book_cover(target.stem, fmt)
            return cover_bytes, "image/jpeg"

        # Video file first frame / cover
        if target.is_file() and target.suffix.lower() in VIDEO_EXTENSIONS:
            frame_bytes = extract_video_first_frame(target)
            if frame_bytes:
                return frame_bytes, "image/jpeg"
            raise ValueError("Could not extract frame from video")

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
        """Generate and cache a thumbnail with two-tier in-memory and disk caching."""
        mtime = os.path.getmtime(path_str) if os.path.exists(path_str) else 0
        cache_key = f"{path_str}:{mtime}:{page_index}:{max_size}"

        # 1. Check ultra-fast in-memory cache
        if cache_key in _MEM_THUMB_CACHE:
            return _MEM_THUMB_CACHE[cache_key]

        # 2. Check disk cache
        cache_file = get_cache_path(cache_key, ext=".webp")
        if cache_file.exists():
            try:
                with open(cache_file, "rb") as f:
                    cached_data = f.read()
                    res = (cached_data, "image/webp")
                    if len(_MEM_THUMB_CACHE) < _MAX_MEM_CACHE_ITEMS:
                        _MEM_THUMB_CACHE[cache_key] = res
                    return res
            except Exception:
                pass

        # 3. Generate on the fly
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

                im.thumbnail((max_size, max_size), Image.Resampling.BILINEAR)
                
                output = io.BytesIO()
                # Fast WebP encoding (method=1 is 5x-8x faster on CPU than method=4)
                im.save(output, format="WEBP", quality=80, method=1)
                thumb_bytes = output.getvalue()

                # Save to disk cache
                try:
                    with open(cache_file, "wb") as f:
                        f.write(thumb_bytes)
                except Exception:
                    pass

                res = (thumb_bytes, "image/webp")
                if len(_MEM_THUMB_CACHE) < _MAX_MEM_CACHE_ITEMS:
                    _MEM_THUMB_CACHE[cache_key] = res

                return res
        except Exception as e:
            print(f"Thumbnail generation error: {e}")
            return raw_bytes, "image/jpeg"

    @staticmethod
    def get_optimized_page_bytes(path_str: str, page_index: int, max_dimension: int = 2048, quality: int = 80) -> Tuple[bytes, str]:
        """
        Weak network optimization:
        Compresses image into optimized WebP with fast scaling (max 2048px)
        and caches on disk for zero-latency subsequent delivery.
        """
        mtime = os.path.getmtime(path_str) if os.path.exists(path_str) else 0
        cache_key = f"opt:{path_str}:{mtime}:{page_index}:{max_dimension}:{quality}"
        cache_file = get_cache_path(cache_key, ext=".webp")

        if cache_file.exists():
            try:
                with open(cache_file, "rb") as f:
                    return f.read(), "image/webp"
            except Exception:
                pass

        raw_bytes, media_type = ComicReader.get_page_bytes(path_str, page_index)

        # Do not convert animated GIF
        if media_type == "image/gif":
            return raw_bytes, "image/gif"

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
                    im.thumbnail((max_dimension, max_dimension), Image.Resampling.BILINEAR)

                output = io.BytesIO()
                # Fast method=1 for non-blocking multi-client delivery
                im.save(output, format="WEBP", quality=quality, method=1)
                opt_bytes = output.getvalue()

                # Cache to disk
                try:
                    with open(cache_file, "wb") as f:
                        f.write(opt_bytes)
                except Exception:
                    pass

                return opt_bytes, "image/webp"
        except Exception as e:
            print(f"Optimization fallback: {e}")
            return raw_bytes, "image/jpeg"

