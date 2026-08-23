import os
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from .config import load_config, save_config, add_bookshelf, remove_bookshelf
from .utils import encode_path, decode_path, get_local_ips
from .reader import ComicReader
from .scanner import LibraryScanner

app = FastAPI(title="Local Comic & Picture Reader", version="1.0.0")

# Enable CORS for local network and frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


class BookshelfCreate(BaseModel):
    path: str
    name: Optional[str] = ""


class SettingsUpdate(BaseModel):
    settings: Dict[str, Any]


@app.get("/api/info")
def get_system_info():
    port = int(os.environ.get("PORT", 8000))
    ips = get_local_ips()
    urls = [f"http://{ip}:{port}" for ip in ips]
    return {
        "app": "Local Comic & Album Reader",
        "platform": sys.platform,
        "port": port,
        "local_ips": ips,
        "lan_urls": urls
    }


@app.get("/api/config")
def get_configuration():
    return load_config()


@app.post("/api/config/settings")
def update_settings(payload: SettingsUpdate):
    cfg = load_config()
    cfg["settings"].update(payload.settings)
    save_config(cfg)
    return {"status": "success", "settings": cfg["settings"]}


@app.post("/api/config/bookshelves")
def create_bookshelf(shelf: BookshelfCreate):
    try:
        new_shelf = add_bookshelf(shelf.path, shelf.name or "")
        return {"status": "success", "bookshelf": new_shelf}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"添加书架失败: {str(e)}")


@app.delete("/api/config/bookshelves/{shelf_id}")
def delete_bookshelf(shelf_id: str):
    success = remove_bookshelf(shelf_id)
    if not success:
        raise HTTPException(status_code=404, detail="书架未找到")
    return {"status": "success"}


@app.get("/api/filesystem/drives")
def list_drives_or_roots():
    """List available system roots/drives for easier browsing."""
    roots = []
    if sys.platform == "win32":
        import string
        from ctypes import windll
        bitmask = windll.kernel32.GetLogicalDrives()
        for letter in string.ascii_uppercase:
            if bitmask & 1:
                drive_path = f"{letter}:\\"
                roots.append({"name": f"本地磁盘 ({letter}:)", "path": drive_path})
            bitmask >>= 1
    else:
        # Mac / Linux
        home = str(Path.home())
        roots.append({"name": "主目录 (~)", "path": home})
        downloads = str(Path.home() / "Downloads")
        if os.path.exists(downloads):
            roots.append({"name": "下载 (Downloads)", "path": downloads})
        pictures = str(Path.home() / "Pictures")
        if os.path.exists(pictures):
            roots.append({"name": "图片 (Pictures)", "path": pictures})
        roots.append({"name": "根目录 (/)", "path": "/"})
        if sys.platform == "darwin" and os.path.exists("/Volumes"):
            roots.append({"name": "外置卷 (/Volumes)", "path": "/Volumes"})
    return roots


@app.get("/api/library/browse")
def browse_library(path: Optional[str] = Query(None), encoded_path: Optional[str] = Query(None)):
    """
    Browse a directory.
    If neither path nor encoded_path is given, returns the top-level list of all bookshelves.
    """
    target_path = None
    if encoded_path:
        try:
            target_path = decode_path(encoded_path)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid encoded path")
    elif path:
        target_path = path

    # Top-level Bookshelves
    if not target_path:
        config = load_config()
        shelf_list = []
        for shelf in config.get("bookshelves", []):
            p = Path(shelf["path"])
            cover_target = LibraryScanner.find_first_cover_target(p) if p.exists() else None
            cover_url = f"/api/comic/thumbnail?comic_id={encode_path(cover_target)}&page_index=0" if cover_target else None
            shelf_list.append({
                "id": shelf["id"],
                "name": shelf["name"],
                "path": shelf["path"],
                "encoded_path": encode_path(shelf["path"]),
                "exists": p.exists(),
                "type": "bookshelf",
                "cover_url": cover_url
            })
        return {
            "is_root": True,
            "bookshelves": shelf_list
        }

    # Sub-directory browsing
    try:
        res = LibraryScanner.browse_directory(target_path)
        res["is_root"] = False
        return res
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/comic/details")
def get_comic_details(comic_id: str = Query(...)):
    """Return all pages and metadata for a comic/album."""
    try:
        file_path = decode_path(comic_id)
        info = ComicReader.get_comic_info(file_path)
        return info
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/comic/page")
def get_comic_page(comic_id: str = Query(...), page_index: int = Query(0)):
    """Stream a single page image."""
    try:
        file_path = decode_path(comic_id)
        img_bytes, media_type = ComicReader.get_page_bytes(file_path, page_index)
        return Response(
            content=img_bytes,
            media_type=media_type,
            headers={
                "Cache-Control": "public, max-age=86400",
                "X-Content-Type-Options": "nosniff"
            }
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IndexError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/comic/thumbnail")
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


# Serve static frontend files
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def index():
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/{catch_all:path}")
    def fallback(catch_all: str):
        target_file = FRONTEND_DIR / catch_all
        if target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(FRONTEND_DIR / "index.html")
