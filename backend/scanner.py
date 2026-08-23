import os
import zipfile
from pathlib import Path
from typing import List, Dict, Any, Optional

from .utils import (
    IMAGE_EXTENSIONS,
    ARCHIVE_EXTENSIONS,
    PDF_EXTENSIONS,
    VIDEO_EXTENSIONS,
    BOOK_EXTENSIONS,
    SUPPORTED_EXTENSIONS,
    natural_sort_key,
    encode_path
)


class LibraryScanner:
    @staticmethod
    def is_comic_folder(folder_path: Path) -> bool:
        """Check if folder directly contains images (making it a comic issue/album)."""
        try:
            for entry in folder_path.iterdir():
                if entry.is_file() and entry.suffix.lower() in IMAGE_EXTENSIONS and not entry.name.startswith("."):
                    return True
        except PermissionError:
            return False
        return False

    @staticmethod
    def is_archive_or_pdf_or_video(file_path: Path) -> bool:
        """Check if file is a supported archive, PDF, video or ebook."""
        return file_path.is_file() and file_path.suffix.lower() in (ARCHIVE_EXTENSIONS | PDF_EXTENSIONS | VIDEO_EXTENSIONS | BOOK_EXTENSIONS) and not file_path.name.startswith(".")

    @classmethod
    def find_first_cover_target(cls, folder_path: Path, max_depth: int = 3) -> Optional[str]:
        """Find the first readable comic/image/video target under a directory to use as a cover."""
        if max_depth <= 0:
            return None
        try:
            # Check if this folder itself is a comic folder
            if cls.is_comic_folder(folder_path):
                return str(folder_path.resolve())

            # Check direct archive/pdf/video files
            entries = sorted(list(folder_path.iterdir()), key=lambda x: natural_sort_key(x.name))
            for entry in entries:
                if cls.is_archive_or_pdf_or_video(entry):
                    return str(entry.resolve())

            # Recursively check subfolders
            for entry in entries:
                if entry.is_dir() and not entry.name.startswith("."):
                    found = cls.find_first_cover_target(entry, max_depth - 1)
                    if found:
                        return found
        except Exception:
            pass
        return None

    @classmethod
    def get_comic_page_count_fast(cls, target_path: Path) -> int:
        """Quickly estimate or get page count without full parsing."""
        try:
            if target_path.is_dir():
                return sum(1 for e in target_path.iterdir() if e.is_file() and e.suffix.lower() in IMAGE_EXTENSIONS and not e.name.startswith("."))
            if target_path.suffix.lower() in ARCHIVE_EXTENSIONS:
                with zipfile.ZipFile(str(target_path), 'r') as zf:
                    return sum(1 for n in zf.namelist() if not n.startswith("__MACOSX/") and not Path(n).name.startswith(".") and Path(n).suffix.lower() in IMAGE_EXTENSIONS)
            if target_path.suffix.lower() in PDF_EXTENSIONS:
                import fitz
                doc = fitz.open(str(target_path))
                c = len(doc)
                doc.close()
                return c
            if target_path.suffix.lower() in VIDEO_EXTENSIONS:
                return 1
        except Exception:
            return 0
        return 0

    @classmethod
    def browse_directory(cls, dir_path_str: str, allowed_roots: Optional[List[Path]] = None) -> Dict[str, Any]:
        """Browse a specific directory and return folders and comic files inside it with boundary checks."""
        dir_path = Path(dir_path_str).resolve()
        if not dir_path.exists() or not dir_path.is_dir():
            raise FileNotFoundError(f"目录不存在: {dir_path_str}")

        # Check if dir_path is inside at least one configured bookshelf root
        matched_root = None
        if allowed_roots:
            for root in allowed_roots:
                try:
                    if dir_path == root or root in dir_path.parents:
                        matched_root = root
                        break
                except Exception:
                    pass
            if matched_root is None:
                raise PermissionError("无法访问未在书架中配置的外部目录")

        folders = []
        comics = []

        try:
            entries = list(dir_path.iterdir())
        except PermissionError:
            return {"current_path": str(dir_path), "name": dir_path.name, "folders": [], "comics": []}

        # Filter out hidden files / system directories
        entries = [e for e in entries if not e.name.startswith(".") and not e.name.startswith("$")]
        entries.sort(key=lambda x: natural_sort_key(x.name))

        for entry in entries:
            try:
                if entry.is_dir():
                    # If this directory directly contains images and no other subdirectories with comics, treat as comic
                    sub_dirs = [s for s in entry.iterdir() if s.is_dir() and not s.name.startswith(".")]
                    has_images = cls.is_comic_folder(entry)

                    if has_images and len(sub_dirs) == 0:
                        # Pure comic chapter/album
                        page_count = sum(1 for e in entry.iterdir() if e.is_file() and e.suffix.lower() in IMAGE_EXTENSIONS and not e.name.startswith("."))
                        encoded_id = encode_path(str(entry))
                        comics.append({
                            "id": encoded_id,
                            "name": entry.name,
                            "type": "folder",
                            "path": str(entry),
                            "page_count": page_count,
                            "cover_url": f"/api/comic/thumbnail?comic_id={encoded_id}&page_index=0"
                        })
                    else:
                        # Folder / Series
                        cover_target = cls.find_first_cover_target(entry)
                        cover_url = f"/api/comic/thumbnail?comic_id={encode_path(cover_target)}&page_index=0" if cover_target else None
                        folders.append({
                            "id": encode_path(str(entry)),
                            "name": entry.name,
                            "path": str(entry),
                            "type": "directory",
                            "has_images": has_images,
                            "cover_url": cover_url
                        })
                elif entry.is_file() and entry.suffix.lower() in VIDEO_EXTENSIONS:
                    encoded_id = encode_path(str(entry))
                    comics.append({
                        "id": encoded_id,
                        "name": entry.name,
                        "title": entry.stem,
                        "type": "video",
                        "ext": entry.suffix.lower(),
                        "path": str(entry),
                        "page_count": 1,
                        "cover_url": f"/api/comic/thumbnail?comic_id={encoded_id}&page_index=0"
                    })
                elif entry.is_file() and entry.suffix.lower() in BOOK_EXTENSIONS:
                    encoded_id = encode_path(str(entry))
                    comics.append({
                        "id": encoded_id,
                        "name": entry.name,
                        "title": entry.stem,
                        "type": "book",
                        "ext": entry.suffix.lower(),
                        "path": str(entry),
                        "page_count": 1,
                        "cover_url": f"/api/comic/thumbnail?comic_id={encoded_id}&page_index=0"
                    })
                elif cls.is_archive_or_pdf_or_video(entry):
                    encoded_id = encode_path(str(entry))
                    page_count = cls.get_comic_page_count_fast(entry)
                    comic_type = "pdf" if entry.suffix.lower() in PDF_EXTENSIONS else "archive"
                    comics.append({
                        "id": encoded_id,
                        "name": entry.name,
                        "title": entry.stem,
                        "type": comic_type,
                        "ext": entry.suffix.lower(),
                        "path": str(entry),
                        "page_count": page_count,
                        "cover_url": f"/api/comic/thumbnail?comic_id={encoded_id}&page_index=0" if page_count > 0 else None
                    })
        # If the directory directly contains loose images and no sub-comics/folders, present it as a comic album
        image_files = [e for e in entries if e.is_file() and e.suffix.lower() in IMAGE_EXTENSIONS]
        if image_files and len(folders) == 0 and len(comics) == 0:
            encoded_id = encode_path(str(dir_path))
            comics.append({
                "id": encoded_id,
                "name": dir_path.name,
                "title": dir_path.name,
                "type": "folder",
                "ext": "album",
                "path": str(dir_path),
                "page_count": len(image_files),
                "cover_url": f"/api/comic/thumbnail?comic_id={encoded_id}&page_index=0"
            })

        # Compute safe parent path (do not escape above bookshelf root)
        parent_path_str = None
        encoded_parent_str = None
        is_bookshelf_root = False
        
        if matched_root:
            if dir_path == matched_root:
                is_bookshelf_root = True
                # Parent of root is the top level bookshelf selection (empty encoded path)
                parent_path_str = None
                encoded_parent_str = ""
            elif matched_root in dir_path.parents:
                parent_path = dir_path.parent
                parent_path_str = str(parent_path)
                encoded_parent_str = encode_path(parent_path_str) if parent_path != matched_root else encode_path(str(matched_root))
        elif dir_path.parent != dir_path:
            parent_path_str = str(dir_path.parent)
            encoded_parent_str = encode_path(parent_path_str)

        return {
            "current_path": str(dir_path),
            "name": dir_path.name or str(dir_path),
            "encoded_path": encode_path(str(dir_path)),
            "parent_path": parent_path_str,
            "encoded_parent_path": encoded_parent_str,
            "is_bookshelf_root": is_bookshelf_root,
            "folders": folders,
            "comics": comics,
            "total_items": len(folders) + len(comics)
        }
