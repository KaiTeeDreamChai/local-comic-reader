import os

with open('backend/routers/library.py', 'r') as f:
    content = f.read()

new_endpoint = """

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
                if query in d.lower():
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
                if query in f.lower():
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
"""
with open('backend/routers/library.py', 'w') as f:
    f.write(content + new_endpoint)
