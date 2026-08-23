import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import load_config, save_config, add_bookshelf, remove_bookshelf
from ..utils import get_local_ips

router = APIRouter(tags=["System & Config"])


class BookshelfCreate(BaseModel):
    path: str
    name: Optional[str] = ""


class SettingsUpdate(BaseModel):
    settings: Dict[str, Any]


@router.get("/api/info")
def get_system_info():
    """Return platform info, LAN addresses, and active port."""
    port = int(os.environ.get("PORT", 7891))
    ips = get_local_ips()
    urls = [f"http://{ip}:{port}" for ip in ips]
    return {
        "app": "Local Comic & Album Reader",
        "platform": sys.platform,
        "port": port,
        "local_ips": ips,
        "lan_urls": urls
    }


@router.get("/api/config")
def get_configuration():
    """Retrieve full bookshelf and settings configuration."""
    return load_config()


@router.post("/api/config/settings")
def update_settings(payload: SettingsUpdate):
    """Save updated global preferences."""
    cfg = load_config()
    cfg["settings"].update(payload.settings)
    save_config(cfg)
    return {"status": "success", "settings": cfg["settings"]}


@router.post("/api/config/bookshelves")
def create_bookshelf(shelf: BookshelfCreate):
    """Add a new local root folder to bookshelf configuration."""
    try:
        new_shelf = add_bookshelf(shelf.path, shelf.name or "")
        return {"status": "success", "bookshelf": new_shelf}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"添加书架失败: {str(e)}")


@router.delete("/api/config/bookshelves/{shelf_id}")
def delete_bookshelf(shelf_id: str):
    """Remove a bookshelf entry by ID."""
    success = remove_bookshelf(shelf_id)
    if not success:
        raise HTTPException(status_code=404, detail="书架未找到")
    return {"status": "success"}


@router.get("/api/filesystem/drives")
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
