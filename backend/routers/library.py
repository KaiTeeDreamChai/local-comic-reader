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



def fuzzy_match(query: str, target: str) -> bool:
    q = query.lower()
    t = target.lower()
    if q in t: return True
    q_words = q.split()
    if all(word in t for word in q_words): return True
    import re
    q_clean = re.sub(r'[\W_]+', '', q)
    t_clean = re.sub(r'[\W_]+', '', t)
    if q_clean and q_clean in t_clean: return True
    if len(q_clean) >= 3:
        it = iter(t_clean)
        if all(c in it for c in q_clean): return True
    return False

@router.get("/api/library/search")

def search_library(q: str = Query(...)):
    import os
    from ..scanner import VIDEO_EXTENSIONS, BOOK_EXTENSIONS, ARCHIVE_EXTENSIONS, PDF_EXTENSIONS
    config = load_config()
    allowed_roots = [Path(shelf["path"]).resolve() for shelf in config.get("bookshelves", []) if shelf.get("path")]
    
    query = q.lower()
    folders = []
    comics = []
    max_results = 100
    
    for root in allowed_roots:
        if not root.exists(): continue
        
        for dirpath, dirnames, filenames in os.walk(root):
            if len(folders) + len(comics) >= max_results:
                break
                
            dirnames[:] = [d for d in dirnames if not d.startswith(".") and not d.startswith("$")]
            
            for d in dirnames:
                if fuzzy_match(query, d):
                    full_path = Path(dirpath) / d
                    folders.append({
                        "id": encode_path(str(full_path)),
                        "name": d,
                        "path": str(full_path),
                        "type": "directory",
                        "has_images": False,
                        "cover_url": None
                    })
                    if len(folders) + len(comics) >= max_results: break
            
            if len(folders) + len(comics) >= max_results: break
            
            for f in filenames:
                if f.startswith("."): continue
                if fuzzy_match(query, f):
                    ext = Path(f).suffix.lower()
                    full_path = Path(dirpath) / f
                    
                    if ext in VIDEO_EXTENSIONS:
                        comics.append({
                            "id": encode_path(str(full_path)),
                            "name": f,
                            "title": full_path.stem,
                            "type": "video",
                            "ext": ext,
                            "path": str(full_path),
                            "page_count": 1,
                            "cover_url": None
                        })
                    elif ext in BOOK_EXTENSIONS:
                        comics.append({
                            "id": encode_path(str(full_path)),
                            "name": f,
                            "title": full_path.stem,
                            "type": "book",
                            "ext": ext,
                            "path": str(full_path),
                            "page_count": 1,
                            "cover_url": None
                        })
                    elif ext in ARCHIVE_EXTENSIONS or ext in PDF_EXTENSIONS:
                        t = "pdf" if ext in PDF_EXTENSIONS else "archive"
                        comics.append({
                            "id": encode_path(str(full_path)),
                            "name": f,
                            "title": full_path.stem,
                            "type": t,
                            "ext": ext,
                            "path": str(full_path),
                            "page_count": 0,
                            "cover_url": None
                        })
                    
                    if len(folders) + len(comics) >= max_results: break

        if len(folders) + len(comics) >= max_results:
            break
            
    return {
        "is_root": False,
        "is_search": True,
        "current_path": f"搜索结果: {q}",
        "encoded_path": "",
        "folders": folders,
        "comics": comics,
        "total_items": len(folders) + len(comics)
    }
