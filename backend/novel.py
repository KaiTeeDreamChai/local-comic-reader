import io
import os
import re
import json
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image, ImageDraw, ImageFont

from .utils import (
    BOOK_EXTENSIONS,
    encode_path,
    decode_path
)


class NovelParser:
    """Universal parser for text, markdown, epub, mobi, and other ebook novel formats."""

    @staticmethod
    def parse_txt(file_path: Path) -> Dict[str, Any]:
        """Parse plain text / markdown / log / srt novel file."""
        content = ""
        # Try multiple encodings: UTF-8, GB18030 / GBK (very common for Chinese TXT novels), UTF-16, etc.
        raw_bytes = file_path.read_bytes()
        for enc in ['utf-8-sig', 'utf-8', 'gb18030', 'gbk', 'big5', 'utf-16', 'latin-1']:
            try:
                content = raw_bytes.decode(enc)
                break
            except (UnicodeDecodeError, LookupError):
                continue

        if not content:
            content = raw_bytes.decode('utf-8', errors='replace')

        lines = content.splitlines()
        chapters = []
        current_chapter_title = "序章 / 前言"
        current_paragraphs = []

        # Regex for Chinese and Western chapter headings
        # e.g., 第1章, 第十二章, 卷一, Chapter 1, Section 2, Prologue, etc.
        chapter_pattern = re.compile(
            r'^\s*(第[0-9一二三四五六七八九十百千万]+[章回节卷集幕篇部]|Chapter\s+[0-9IVXLCDM]+|Section\s+[0-9]+|Prologue|Epilogue|序章|尾声|终章|前言|楔子|附录|引子).*$',
            re.IGNORECASE
        )

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Check if this line is a chapter heading (and not too long, < 60 chars)
            if len(line_str) <= 60 and chapter_pattern.match(line_str):
                if current_paragraphs:
                    chapters.append({
                        "title": current_chapter_title,
                        "paragraphs": current_paragraphs
                    })
                    current_paragraphs = []
                current_chapter_title = line_str
            else:
                current_paragraphs.append(line.rstrip())

        if current_paragraphs or not chapters:
            chapters.append({
                "title": current_chapter_title if chapters else (file_path.stem),
                "paragraphs": current_paragraphs if current_paragraphs else [content]
            })

        # If novel has no explicit chapter marks, auto-split every ~60-80 paragraphs into readable sections
        if len(chapters) == 1 and len(chapters[0]["paragraphs"]) > 100:
            all_paras = chapters[0]["paragraphs"]
            chunk_size = 80
            new_chapters = []
            for i in range(0, len(all_paras), chunk_size):
                chunk = all_paras[i:i + chunk_size]
                part_num = (i // chunk_size) + 1
                new_chapters.append({
                    "title": f"第 {part_num} 部分",
                    "paragraphs": chunk
                })
            chapters = new_chapters

        total_words = sum(len(p) for c in chapters for p in c["paragraphs"])

        return {
            "title": file_path.stem,
            "format": file_path.suffix.lower()[1:],
            "total_chapters": len(chapters),
            "total_words": total_words,
            "chapters": chapters
        }

    @staticmethod
    def parse_epub(file_path: Path) -> Dict[str, Any]:
        """Parse EPUB container and extract chapters and HTML/XHTML texts without external dependencies."""
        try:
            with zipfile.ZipFile(str(file_path), 'r') as zf:
                # 1. Read container.xml to find OPF path
                container_data = zf.read("META-INF/container.xml")
                root = ET.fromstring(container_data)
                opf_path = ""
                for rootfile in root.iter():
                    if rootfile.attrib.get("full-path"):
                        opf_path = rootfile.attrib["full-path"]
                        break

                if not opf_path:
                    opf_path = "content.opf"

                opf_dir = str(Path(opf_path).parent)
                if opf_dir == ".":
                    opf_dir = ""

                # 2. Parse OPF manifest & spine
                opf_data = zf.read(opf_path)
                opf_root = ET.fromstring(opf_data)
                
                # Namespace handling
                manifest = {}
                for item in opf_root.iter():
                    if item.tag.endswith("item") and "id" in item.attrib and "href" in item.attrib:
                        href = item.attrib["href"]
                        full_href = f"{opf_dir}/{href}" if opf_dir else href
                        full_href = full_href.replace("//", "/")
                        manifest[item.attrib["id"]] = full_href

                spine_order = []
                for itemref in opf_root.iter():
                    if itemref.tag.endswith("itemref") and "idref" in itemref.attrib:
                        idref = itemref.attrib["idref"]
                        if idref in manifest:
                            spine_order.append(manifest[idref])

                if not spine_order:
                    # Fallback to all xhtml/html files in zip
                    spine_order = [n for n in zf.namelist() if n.lower().endswith(('.html', '.xhtml', '.htm'))]

                # 3. Extract text from HTML chapters
                chapters = []
                for href in spine_order:
                    try:
                        # Decode URL characters if any
                        clean_href = href.replace("%20", " ")
                        if clean_href in zf.namelist():
                            html_bytes = zf.read(clean_href)
                        else:
                            # Try finding matching filename in zip
                            candidates = [n for n in zf.namelist() if Path(n).name == Path(clean_href).name]
                            if candidates:
                                html_bytes = zf.read(candidates[0])
                            else:
                                continue

                        # Decode text
                        html_text = ""
                        for enc in ['utf-8', 'gb18030', 'latin-1']:
                            try:
                                html_text = html_bytes.decode(enc)
                                break
                            except Exception:
                                pass

                        # Extract title from <title> or <h1>/<h2>
                        title_match = re.search(r'<title[^>]*>(.*?)</title>', html_text, re.IGNORECASE | re.DOTALL)
                        h_match = re.search(r'<h[1-3][^>]*>(.*?)</h[1-3]>', html_text, re.IGNORECASE | re.DOTALL)
                        
                        chapter_title = ""
                        if h_match:
                            chapter_title = re.sub(r'<[^>]+>', '', h_match.group(1)).strip()
                        elif title_match:
                            chapter_title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()

                        if not chapter_title:
                            chapter_title = f"章节 {len(chapters) + 1}"

                        # Remove script & style tags
                        clean_html = re.sub(r'<script[^>]*>.*?</script>', '', html_text, flags=re.DOTALL | re.IGNORECASE)
                        clean_html = re.sub(r'<style[^>]*>.*?</style>', '', clean_html, flags=re.DOTALL | re.IGNORECASE)

                        # Extract paragraphs <p>...</p> or <div>...</div> or split by tags
                        p_matches = re.findall(r'<(?:p|div|h[1-6]|li)[^>]*>(.*?)</(?:p|div|h[1-6]|li)>', clean_html, flags=re.DOTALL | re.IGNORECASE)
                        paragraphs = []
                        if p_matches:
                            for p in p_matches:
                                text_p = re.sub(r'<[^>]+>', '', p).strip()
                                text_p = text_p.replace('&nbsp;', ' ').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&').replace('&quot;', '"')
                                if text_p:
                                    paragraphs.append(text_p)
                        else:
                            # Fallback strip all tags
                            all_text = re.sub(r'<[^>]+>', '\n', clean_html)
                            for line in all_text.splitlines():
                                line_clean = line.strip()
                                if line_clean:
                                    paragraphs.append(line_clean)

                        if paragraphs:
                            chapters.append({
                                "title": chapter_title,
                                "paragraphs": paragraphs
                            })
                    except Exception as e:
                        print(f"Error parsing EPUB item {href}: {e}")

                if not chapters:
                    return NovelParser.parse_txt(file_path)

                total_words = sum(len(p) for c in chapters for p in c["paragraphs"])
                return {
                    "title": file_path.stem,
                    "format": "epub",
                    "total_chapters": len(chapters),
                    "total_words": total_words,
                    "chapters": chapters
                }
        except Exception as e:
            print(f"EPUB parse error fallback to TXT: {e}")
            return NovelParser.parse_txt(file_path)

    @classmethod
    def parse_book(cls, file_path_str: str) -> Dict[str, Any]:
        """Parse any supported ebook file into structured chapter & paragraph data."""
        p = Path(file_path_str).resolve()
        if not p.exists() or not p.is_file():
            raise FileNotFoundError(f"Ebook file not found: {file_path_str}")

        ext = p.suffix.lower()
        if ext == ".epub":
            data = cls.parse_epub(p)
        else:
            data = cls.parse_txt(p)

        encoded_id = encode_path(str(p))
        data["id"] = encoded_id
        data["path"] = str(p)
        data["type"] = "book"
        data["cover_url"] = f"/api/comic/thumbnail?comic_id={encoded_id}&page_index=0"
        return data

    @staticmethod
    def generate_book_cover(title: str, format_str: str = "TXT") -> bytes:
        """Generate a book cover image for text / ebook files."""
        width, height = 600, 800
        # Color themes based on format
        bg_colors = {
            "TXT": ((30, 41, 59), (15, 23, 42)),      # Slate blue
            "EPUB": ((19, 78, 74), (4, 47, 46)),      # Emerald teal
            "MOBI": ((120, 53, 15), (69, 26, 3)),     # Amber bronze
            "MD": ((67, 56, 202), (49, 46, 129)),     # Indigo
        }
        fmt = format_str.upper()
        c1, c2 = bg_colors.get(fmt, ((39, 39, 42), (24, 24, 27)))

        # Create gradient-like background
        img = Image.new("RGB", (width, height), color=c1)
        draw = ImageDraw.Draw(img)

        # Draw decorative book spine line
        draw.rectangle([(0, 0), (36, height)], fill=c2)
        draw.line([(36, 0), (36, height)], fill=(255, 255, 255, 40), width=2)
        draw.line([(40, 0), (40, height)], fill=(0, 0, 0, 80), width=2)

        # Draw decorative inner border
        draw.rectangle([(60, 40), (width - 40, height - 40)], outline=(255, 255, 255, 30), width=1)

        # Draw Book Icon
        draw.rectangle([(270, 180), (330, 240)], outline=(255, 255, 255), width=2)
        draw.line([(300, 180), (300, 240)], fill=(255, 255, 255), width=2)

        # Draw Badge for Format
        draw.rounded_rectangle([(70, 60), (160, 95)], radius=6, fill=(59, 130, 246))
        draw.text((115, 77), fmt, fill=(255, 255, 255), anchor="mm")

        # Draw Title (wrap text)
        display_title = title if len(title) <= 24 else title[:22] + "..."
        draw.text((width // 2 + 10, 360), display_title, fill=(244, 244, 245), anchor="mm")

        # Footer Text
        draw.text((width // 2 + 10, height - 80), "EBOOK READER", fill=(161, 161, 170), anchor="mm")

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return buf.getvalue()
