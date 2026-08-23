import io
import os
import sys
import shutil
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import fitz

# Setup test sample bookshelf
SAMPLE_DIR = Path(__file__).resolve().parent / "test_data"
if SAMPLE_DIR.exists():
    shutil.rmtree(SAMPLE_DIR)
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

# 1. Create a comic folder with natural order images
manga_folder = SAMPLE_DIR / "Sample Manga Issue 1"
manga_folder.mkdir(parents=True, exist_ok=True)
for page_num in [1, 2, 3, 10]:
    img = Image.new('RGB', (600, 800), color=(30, 40, 60))
    d = ImageDraw.Draw(img)
    d.text((200, 380), f"Page {page_num}", fill=(255, 255, 255))
    img.save(manga_folder / f"page_{page_num}.png")

# 2. Create a .cbz archive comic
cbz_file = SAMPLE_DIR / "Sample Archive Comic.cbz"
with zipfile.ZipFile(str(cbz_file), 'w') as zf:
    for page_num in [1, 2, 5]:
        img = Image.new('RGB', (600, 800), color=(60, 30, 40))
        d = ImageDraw.Draw(img)
        d.text((200, 380), f"CBZ Page {page_num}", fill=(255, 255, 255))
        img_path = SAMPLE_DIR / f"temp_{page_num}.jpg"
        img.save(img_path)
        zf.write(str(img_path), arcname=f"page_{page_num}.jpg")
        img_path.unlink()

# 3. Create a .pdf comic
pdf_file = SAMPLE_DIR / "Sample PDF Comic.pdf"
doc = fitz.open()
for page_num in [1, 2, 3]:
    page = doc.new_page(width=595, height=842)
    page.draw_rect(fitz.Rect(0, 0, 595, 842), color=(0.1, 0.2, 0.3), fill=(0.1, 0.2, 0.3))
    page.insert_text((200, 400), f"PDF Page {page_num}", fontsize=32, color=(1, 1, 1))
doc.save(str(pdf_file))
doc.close()

print("Sample test data successfully generated in:", SAMPLE_DIR)

# Run FastAPI tests using TestClient
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

# Test /api/info
res_info = client.get("/api/info")
assert res_info.status_code == 200, f"Failed info: {res_info.text}"
print("✓ /api/info passed:", res_info.json()["lan_urls"])

# Test adding bookshelf
res_shelf = client.post("/api/config/bookshelves", json={"path": str(SAMPLE_DIR), "name": "测试书架"})
assert res_shelf.status_code == 200, f"Failed add bookshelf: {res_shelf.text}"
shelf_id = res_shelf.json()["bookshelf"]["id"]
print("✓ /api/config/bookshelves add passed")

# Test browse root
res_browse_root = client.get("/api/library/browse")
assert res_browse_root.status_code == 200
assert len(res_browse_root.json()["bookshelves"]) > 0
print("✓ /api/library/browse (root) passed")

# Test browse specific shelf
shelf_encoded = res_browse_root.json()["bookshelves"][-1]["encoded_path"]
res_browse_sub = client.get(f"/api/library/browse?encoded_path={shelf_encoded}")
assert res_browse_sub.status_code == 200
data_sub = res_browse_sub.json()
print("✓ /api/library/browse (sub) found comics:", len(data_sub["comics"]), "folders:", len(data_sub["folders"]))
assert len(data_sub["comics"]) >= 2  # Folder comic + CBZ + PDF

# Test comic details
for comic in data_sub["comics"]:
    c_id = comic["id"]
    res_details = client.get(f"/api/comic/details?comic_id={c_id}")
    assert res_details.status_code == 200
    info = res_details.json()
    print(f"✓ Comic details for '{info['title']}' ({info['type']}): {info['total_pages']} pages")
    
    # Test natural sorting for folder comic (page_1, page_2, page_3, page_10)
    if info['type'] == 'folder':
        page_names = [p['page_name'] for p in info['pages']]
        assert page_names == ['page_1.png', 'page_2.png', 'page_3.png', 'page_10.png'], f"Sorting failed: {page_names}"
        print("✓ Natural sorting verified correctly:", page_names)

    # Test get page image
    res_page = client.get(f"/api/comic/page?comic_id={c_id}&page_index=0")
    assert res_page.status_code == 200
    assert len(res_page.content) > 100
    
    # Test get thumbnail image
    res_thumb = client.get(f"/api/comic/thumbnail?comic_id={c_id}&page_index=0")
    assert res_thumb.status_code == 200
    assert len(res_thumb.content) > 100

    # Test download comic as zip
    res_dl = client.get(f"/api/comic/download?comic_id={c_id}")
    assert res_dl.status_code == 200, f"Download failed for {info['title']}: {res_dl.text}"
    assert "attachment" in res_dl.headers.get("content-disposition", "")
    assert zipfile.is_zipfile(io.BytesIO(res_dl.content)), f"Downloaded payload is not a valid zip for {info['title']}"
    print(f"✓ ZIP download verified for '{info['title']}' ({len(res_dl.content)} bytes)")

print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
