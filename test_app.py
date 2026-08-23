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

# 4. Create a dummy video file
video_file = SAMPLE_DIR / "Sample Clip.mp4"
video_file.write_bytes(b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42\x00\x00\x00\x08free")

# 5. Create a sample TXT novel with chapters
txt_novel = SAMPLE_DIR / "Sample Novel.txt"
txt_content = """
第1章 异界的初遇
这是一个宁静的午后，微风吹拂着山谷，少年踏上了未知的旅程。
在这个神奇的大陆上，到处都是充满未知的冒险。

第2章 命运的齿轮
第二天清晨，太阳从东方升起，一切都变得不同了。
伙伴们聚集在一起，准备迎接全新的挑战。

第3章 终极之战
终于来到了最终的目的地，决战即将开启。
"""
txt_novel.write_text(txt_content.strip(), encoding="utf-8")

# 6. Create a sample EPUB novel
epub_file = SAMPLE_DIR / "Sample Ebook.epub"
with zipfile.ZipFile(str(epub_file), 'w') as zf:
    zf.writestr("mimetype", "application/epub+zip")
    zf.writestr("META-INF/container.xml", """<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>""")
    zf.writestr("OEBPS/content.opf", """<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
  <manifest>
    <item id="chapter1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter2" href="ch2.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
    <itemref idref="chapter2"/>
  </spine>
</package>""")
    zf.writestr("OEBPS/ch1.xhtml", """<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter 1: The Beginning</title></head>
<body>
  <h1>Chapter 1: The Beginning</h1>
  <p>It was the best of times, it was the worst of times.</p>
</body>
</html>""")
    zf.writestr("OEBPS/ch2.xhtml", """<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter 2: The Journey</title></head>
<body>
  <h2>Chapter 2: The Journey</h2>
  <p>The journey continues across the vast continent.</p>
</body>
</html>""")

print("Sample test data successfully generated in:", SAMPLE_DIR)

# Run FastAPI tests using TestClient
from fastapi.testclient import TestClient
from backend.app import app
from backend.utils import encode_path

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
print("✓ /api/library/browse (sub) found items (comics/videos):", len(data_sub["comics"]), "folders:", len(data_sub["folders"]))
assert len(data_sub["comics"]) >= 3  # Folder comic + CBZ + PDF + Video

# Test bookshelf boundary security (attempting to browse parent directory of bookshelf root)
parent_encoded = encode_path(str(SAMPLE_DIR.parent))
res_outside = client.get(f"/api/library/browse?encoded_path={parent_encoded}")
assert res_outside.status_code == 403, f"Expected 403 for unauthorized path but got: {res_outside.status_code}"
print("✓ Bookshelf boundary security verified (forbidden from browsing outside configured bookshelf)")

# Test comic & video details
for comic in data_sub["comics"]:
    c_id = comic["id"]
    res_details = client.get(f"/api/comic/details?comic_id={c_id}")
    assert res_details.status_code == 200
    info = res_details.json()
    print(f"✓ Details for '{info['title']}' ({info['type']}): {info['total_pages']} pages/files")
    
    # Test natural sorting for folder comic (page_1, page_2, page_3, page_10)
    if info['type'] == 'folder':
        page_names = [p['page_name'] for p in info['pages']]
        assert page_names == ['page_1.png', 'page_2.png', 'page_3.png', 'page_10.png'], f"Sorting failed: {page_names}"
        print("✓ Natural sorting verified correctly:", page_names)

    if info['type'] == 'video':
        # Test video streaming endpoint
        res_vid = client.get(f"/api/video/stream?comic_id={c_id}", headers={"Range": "bytes=0-10"})
        assert res_vid.status_code in [200, 206]
        print("✓ Video stream range request verified for video")
        continue

    if info['type'] == 'book':
        assert "chapters" in info and len(info["chapters"]) > 0
        assert info["total_chapters"] == len(info["chapters"])
        assert len(info["chapters"][0]["paragraphs"]) > 0
        print(f"✓ Novel content verified for '{info['title']}': {info['total_chapters']} chapters, {info['total_words']} words")
        
        # Test get book cover thumbnail
        res_thumb = client.get(f"/api/comic/thumbnail?comic_id={c_id}&page_index=0")
        assert res_thumb.status_code == 200
        assert len(res_thumb.content) > 100
        print(f"✓ Novel book cover generated for '{info['title']}' ({len(res_thumb.content)} bytes)")
        continue

    # Test get page image (normal and optimized)
    res_page = client.get(f"/api/comic/page?comic_id={c_id}&page_index=0")
    assert res_page.status_code == 200
    assert len(res_page.content) > 100

    res_opt_page = client.get(f"/api/comic/page?comic_id={c_id}&page_index=0&optimize=true")
    assert res_opt_page.status_code == 200
    assert res_opt_page.headers["content-type"] == "image/webp"
    assert len(res_opt_page.content) > 100
    print(f"✓ Optimized WebP page verified for '{info['title']}' ({len(res_opt_page.content)} bytes)")
    
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
