import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

COLLECTIONS_DIR = Path(__file__).resolve().parent.parent / "data"
COLLECTIONS_FILE = COLLECTIONS_DIR / "collections.json"

DEFAULT_COLLECTIONS: Dict[str, Any] = {
    "favorites": [],
    "read_later": [],
    "categories": []
}


def load_collections() -> Dict[str, Any]:
    COLLECTIONS_DIR.mkdir(parents=True, exist_ok=True)
    if not COLLECTIONS_FILE.exists():
        save_collections(DEFAULT_COLLECTIONS)
        return DEFAULT_COLLECTIONS.copy()
    try:
        with open(COLLECTIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            for k, v in DEFAULT_COLLECTIONS.items():
                if k not in data:
                    data[k] = v
            return data
    except Exception as e:
        print(f"Error loading collections: {e}")
        return DEFAULT_COLLECTIONS.copy()


def save_collections(data: Dict[str, Any]) -> None:
    COLLECTIONS_DIR.mkdir(parents=True, exist_ok=True)
    with open(COLLECTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def sanitize_item(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": item.get("id", ""),
        "path": item.get("path", ""),
        "name": item.get("name") or item.get("title", "未命名"),
        "title": item.get("title") or item.get("name", "未命名"),
        "type": item.get("type", "folder"),
        "ext": item.get("ext", ""),
        "page_count": item.get("page_count", 0),
        "cover_url": item.get("cover_url"),
        "added_at": int(time.time())
    }


def toggle_favorite(item: Dict[str, Any]) -> Dict[str, Any]:
    data = load_collections()
    item_id = item.get("id")
    if not item_id:
        raise ValueError("Missing item id")

    existing_idx = next((i for i, x in enumerate(data["favorites"]) if x["id"] == item_id), -1)
    is_favorite = False
    if existing_idx >= 0:
        data["favorites"].pop(existing_idx)
        is_favorite = False
    else:
        clean_item = sanitize_item(item)
        data["favorites"].insert(0, clean_item)
        is_favorite = True

    save_collections(data)
    return {
        "is_favorite": is_favorite,
        "favorites": data["favorites"],
        "total_favorites": len(data["favorites"])
    }


def toggle_read_later(item: Dict[str, Any]) -> Dict[str, Any]:
    data = load_collections()
    item_id = item.get("id")
    if not item_id:
        raise ValueError("Missing item id")

    existing_idx = next((i for i, x in enumerate(data["read_later"]) if x["id"] == item_id), -1)
    is_read_later = False
    if existing_idx >= 0:
        data["read_later"].pop(existing_idx)
        is_read_later = False
    else:
        clean_item = sanitize_item(item)
        data["read_later"].insert(0, clean_item)
        is_read_later = True

    save_collections(data)
    return {
        "is_read_later": is_read_later,
        "read_later": data["read_later"],
        "total_read_later": len(data["read_later"])
    }


def create_category(name: str) -> Dict[str, Any]:
    name = name.strip()
    if not name:
        raise ValueError("分类名称不能为空")

    data = load_collections()
    for cat in data["categories"]:
        if cat["name"].lower() == name.lower():
            raise ValueError(f"已存在同名分类: {name}")

    new_cat = {
        "id": f"cat_{int(time.time() * 1000)}",
        "name": name,
        "created_at": int(time.time()),
        "items": []
    }
    data["categories"].append(new_cat)
    save_collections(data)
    return new_cat


def rename_category(category_id: str, new_name: str) -> Dict[str, Any]:
    new_name = new_name.strip()
    if not new_name:
        raise ValueError("分类名称不能为空")

    data = load_collections()
    target_cat = next((c for c in data["categories"] if c["id"] == category_id), None)
    if not target_cat:
        raise ValueError("分类不存在")

    for cat in data["categories"]:
        if cat["id"] != category_id and cat["name"].lower() == new_name.lower():
            raise ValueError(f"已存在同名分类: {new_name}")

    target_cat["name"] = new_name
    save_collections(data)
    return target_cat


def delete_category(category_id: str) -> bool:
    data = load_collections()
    initial_len = len(data["categories"])
    data["categories"] = [c for c in data["categories"] if c["id"] != category_id]
    if len(data["categories"]) != initial_len:
        save_collections(data)
        return True
    return False


def toggle_category_item(category_id: str, item: Dict[str, Any]) -> Dict[str, Any]:
    item_id = item.get("id")
    if not item_id:
        raise ValueError("Missing item id")

    data = load_collections()
    target_cat = next((c for c in data["categories"] if c["id"] == category_id), None)
    if not target_cat:
        raise ValueError("分类不存在")

    existing_idx = next((i for i, x in enumerate(target_cat["items"]) if x["id"] == item_id), -1)
    is_in_category = False
    if existing_idx >= 0:
        target_cat["items"].pop(existing_idx)
        is_in_category = False
    else:
        clean_item = sanitize_item(item)
        target_cat["items"].insert(0, clean_item)
        is_in_category = True

    save_collections(data)
    return {
        "is_in_category": is_in_category,
        "category": target_cat,
        "categories": data["categories"]
    }
