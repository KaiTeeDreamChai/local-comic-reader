import io
import zipfile
from pathlib import Path
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import FileResponse, StreamingResponse

from ..utils import (
    decode_path,
    ARCHIVE_EXTENSIONS,
    IMAGE_EXTENSIONS,
    PDF_EXTENSIONS,
    BOOK_EXTENSIONS,
    natural_sort_key
)
from ..reader import ComicReader

router = APIRouter(tags=["Comics & Ebooks"])


@router.get("/api/comic/details")
def get_comic_details(comic_id: str = Query(...)):
    """Return all pages and metadata for a comic/album/novel."""
    try:
        file_path = decode_path(comic_id)
        info = ComicReader.get_comic_info(file_path)
        return info
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/comic/page")
def get_comic_page(comic_id: str = Query(...), page_index: int = Query(0), optimize: bool = Query(False)):
    """Stream a single page image (supports weak network WebP optimization & caching)."""
    try:
        file_path = decode_path(comic_id)
        if optimize:
            img_bytes, media_type = ComicReader.get_optimized_page_bytes(file_path, page_index)
        else:
            img_bytes, media_type = ComicReader.get_page_bytes(file_path, page_index)

        return Response(
            content=img_bytes,
            media_type=media_type,
            headers={
                "Cache-Control": "public, max-age=2592000, immutable",
                "X-Content-Type-Options": "nosniff"
            }
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IndexError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/comic/thumbnail")
def get_comic_thumbnail(comic_id: str = Query(...), page_index: int = Query(0), size: int = Query(360)):
    """Get a resized thumbnail with cache headers."""
    try:
        file_path = decode_path(comic_id)
        img_bytes, media_type = ComicReader.get_thumbnail_bytes(file_path, page_index, max_size=size)
        return Response(
            content=img_bytes,
            media_type=media_type,
            headers={
                "Cache-Control": "public, max-age=604800",
                "X-Content-Type-Options": "nosniff"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/api/comic/download")
def download_comic(comic_id: str = Query(...)):
    """Download the comic / album as a zip file, or direct file download for ebooks."""
    try:
        file_path_str = decode_path(comic_id)
        target = Path(file_path_str)
        if not target.exists():
            raise HTTPException(status_code=404, detail="漫画文件或目录不存在")

        filename = f"{target.stem if target.is_file() else target.name}.zip"
        encoded_filename = quote(filename)

        # If already a zip or cbz, stream file directly with zip extension
        if target.is_file() and target.suffix.lower() in ARCHIVE_EXTENSIONS:
            return FileResponse(
                path=str(target),
                media_type="application/zip",
                filename=filename,
                headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
            )

        # If ebook file, allow direct file download
        if target.is_file() and target.suffix.lower() in BOOK_EXTENSIONS:
            orig_filename = target.name
            encoded_orig = quote(orig_filename)
            return FileResponse(
                path=str(target),
                media_type="text/plain",
                filename=orig_filename,
                headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_orig}"}
            )

        # If it's a folder of images or a PDF, pack into a ZIP archive
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            if target.is_dir():
                img_files = [
                    e for e in target.iterdir()
                    if e.is_file() and e.suffix.lower() in IMAGE_EXTENSIONS and not e.name.startswith(".")
                ]
                img_files.sort(key=lambda x: natural_sort_key(x.name))
                for f in img_files:
                    zf.write(str(f), arcname=f.name)
            elif target.is_file() and target.suffix.lower() in PDF_EXTENSIONS:
                import pymupdf as fitz
                doc = fitz.open(str(target))
                for i in range(len(doc)):
                    page = doc.load_page(i)
                    pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0), alpha=False)
                    img_bytes = pix.tobytes("jpeg")
                    zf.writestr(f"page_{i+1:04d}.jpg", img_bytes)
                doc.close()

        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
                "Content-Length": str(buf.getbuffer().nbytes)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"打包下载失败: {str(e)}")
