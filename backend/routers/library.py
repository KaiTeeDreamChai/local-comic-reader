from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from ..config import load_config
from ..utils import encode_path, decode_path
from ..scanner import LibraryScanner

router = APIRouter(tags=["Library & Browsing"])


@router.get("/api/library/browse")
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
    config = load_config()
    allowed_roots = [Path(shelf["path"]).resolve() for shelf in config.get("bookshelves", []) if shelf.get("path")]

    if not target_path:
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

    # Sub-directory browsing with bookshelf boundary enforcement
    try:
        res = LibraryScanner.browse_directory(target_path, allowed_roots=allowed_roots)
        res["is_root"] = False
        return res
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail="该目录不存在、已被移动或无权限访问")
    except ValueError as e:
        raise HTTPException(status_code=400, detail="该目录路径无效或不可用")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"访问目录出错: {str(e)}")
