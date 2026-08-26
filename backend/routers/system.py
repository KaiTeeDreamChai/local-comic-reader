import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import load_config, save_config, add_bookshelf, remove_bookshelf
from ..utils import get_local_ips, get_server_network_info

router = APIRouter(tags=["System & Config"])


class BookshelfCreate(BaseModel):
    path: str
    name: Optional[str] = ""


class SettingsUpdate(BaseModel):
    settings: Dict[str, Any]


@router.get("/api/info")
def get_system_info():
    """Return platform info, LAN IPv4 addresses, Remote IPv6 addresses, and custom domain URLs."""
    port = int(os.environ.get("PORT", 7891))
    cfg = load_config()
    custom_domain = cfg.get("settings", {}).get("custom_domain", "").strip()

    net_info = get_server_network_info()
    ipv4_list = net_info.get("ipv4", [])
    ipv6_list = net_info.get("ipv6", [])
    
    lan_urls = [f"http://{ip}:{port}" for ip in ipv4_list]
    ipv6_urls = [f"http://[{ip}]:{port}" for ip in ipv6_list]
    
    custom_domain_urls = []
    if custom_domain:
        clean_domain = custom_domain
        protocol = "http"
        if clean_domain.startswith("https://"):
            protocol = "https"
            clean_domain = clean_domain[8:]
        elif clean_domain.startswith("http://"):
            clean_domain = clean_domain[7:]
            
        clean_domain = clean_domain.rstrip("/")
        
        if clean_domain.startswith("[") and "]" in clean_domain:
            if clean_domain.endswith("]"):
                custom_domain_urls.append(f"{protocol}://{clean_domain}:{port}")
            else:
                custom_domain_urls.append(f"{protocol}://{clean_domain}")
        elif ":" in clean_domain:
            custom_domain_urls.append(f"{protocol}://{clean_domain}")
        else:
            import ipaddress
            try:
                ip_obj = ipaddress.ip_address(clean_domain)
                if ip_obj.version == 6:
                    custom_domain_urls.append(f"{protocol}://[{clean_domain}]:{port}")
                else:
                    custom_domain_urls.append(f"{protocol}://{clean_domain}:{port}")
            except Exception:
                custom_domain_urls.append(f"{protocol}://{clean_domain}:{port}")
    
    return {
        "app": "Local Comic & Album Reader",
        "platform": sys.platform,
        "port": port,
        "local_ips": ipv4_list,
        "lan_urls": lan_urls,
        "ipv6_ips": ipv6_list,
        "ipv6_urls": ipv6_urls,
        "custom_domain": custom_domain,
        "custom_domain_urls": custom_domain_urls
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
