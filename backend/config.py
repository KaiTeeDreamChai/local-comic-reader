import json
import os
from pathlib import Path
from typing import List, Dict, Any

CONFIG_DIR = Path(__file__).resolve().parent.parent / "data"
CONFIG_FILE = CONFIG_DIR / "config.json"

DEFAULT_CONFIG: Dict[str, Any] = {
    "bookshelves": [],
    "settings": {
        "theme": "dark",
        "default_reading_mode": "paged",  # "paged" or "scroll"
        "default_reading_direction": "ltr",  # "ltr" (left to right) or "rtl" (right to left)
        "thumbnail_quality": 80,
        "max_thumbnail_size": 400
    }
}


def load_config() -> Dict[str, Any]:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if not CONFIG_FILE.exists():
        save_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Merge defaults for any missing keys
            for k, v in DEFAULT_CONFIG.items():
                if k not in data:
                    data[k] = v
            return data
    except Exception as e:
        print(f"Error loading config: {e}")
        return DEFAULT_CONFIG.copy()


def save_config(config: Dict[str, Any]) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def add_bookshelf(path_str: str, name: str = "") -> Dict[str, Any]:
    config = load_config()
    clean_path = str(Path(path_str.strip()).resolve())
    
    if not os.path.exists(clean_path):
        raise ValueError(f"路径不存在: {path_str}")
    if not os.path.isdir(clean_path):
        raise ValueError(f"指定路径不是有效文件夹: {path_str}")
        
    for shelf in config["bookshelves"]:
        if str(Path(shelf["path"]).resolve()) == clean_path:
            return shelf
            
    shelf_name = name.strip() if name.strip() else Path(clean_path).name or clean_path
    new_shelf = {
        "id": str(abs(hash(clean_path))),
        "name": shelf_name,
        "path": clean_path
    }
    config["bookshelves"].append(new_shelf)
    save_config(config)
    return new_shelf


def remove_bookshelf(shelf_id: str) -> bool:
    config = load_config()
    initial_len = len(config["bookshelves"])
    config["bookshelves"] = [s for s in config["bookshelves"] if s["id"] != shelf_id]
    if len(config["bookshelves"]) != initial_len:
        save_config(config)
        return True
    return False
