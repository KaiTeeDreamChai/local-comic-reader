# Local Comic, Novel & Media Reader (本地漫画、小说与媒体局域网阅读器)

[中文说明](#-中文说明) | [English README](#-english-readme)

---

## 🇨🇳 中文说明

专为局域网打造的轻量级、高性能本地漫画、小说与画册流媒体阅读器。专为触屏设备（iPad / Android 平板 / 手机）与桌面端深度优化，开箱即用。

### 🌟 核心特性

- **📚 全格式支持**：
  - **小说 & 电子书**：`.txt`, `.epub`, `.mobi`, `.azw3`, `.md`（智能分章、4 款护眼配色、字体缩放、书签管理、无感记忆续读）
  - **漫画 & 图片**：`.zip`, `.cbz`, `.pdf`, `.jpg`, `.png`, `.webp`, `.gif` (动态GIF), `.avif`
  - **视频播放**：`.mp4`, `.mkv`, `.webm`, `.avi`, `.mov`, `.flv`（自动首帧封面、HTTP Range 206 流式传输）
- **🔍 智能模糊搜索**：支持全语言、文件名、文件夹名及后缀名，容错并忽略符号（如括号、空格、大小写），秒级全局检索。
- **📖 双页并排与自然排版**：
  - 支持电脑桌面端及移动端横屏「双页并排阅读」
  - 自由切换 **从左至右 (LTR)** 或 **日漫从右至左 (RTL)** 阅读顺序，以及条漫无限滚动模式。
- **📱 触控手势优化**：双指捏合缩放、双击放大、边缘触控翻页，全面适配 iOS Safari 与 Android Chrome。
- **🛡️ 书架安全沙箱**：可视化增删本地磁盘目录（支持多盘符），严格限制在书架安全边界内，防止越权访问系统文件。
- **⚡ 弱网加速模式**：即时无损 WebP 压缩、前后多页前瞻预加载与磁盘缓存，弱网 Wi-Fi 下依然秒开。
- **🌐 双语与智能端口**：内置中英文即时切换；端口冲突时自动递增分配可用端口（`7891`, `7892`...）。

---

### 🚀 快速启动

#### 方式一：Windows 11 一键运行（推荐）
双击根目录下的 **`run.bat`** 即可（自动检测依赖、分配端口并在默认浏览器中打开）。

#### 方式二：Mac / Linux 运行
```bash
chmod +x run.sh && ./run.sh
```

#### 方式三：手动运行
```bash
pip install -r requirements.txt
python run.py
```

---

### 📱 局域网设备连接（iPad / 手机）

1. 确保手机/平板与电脑处于**同一 Wi-Fi** 下。
2. 电脑网页右上角点击「局域网设备」图标查看连接地址（如 `http://192.168.1.100:7891`）。
3. 手机/平板浏览器直接访问该地址（在 iOS Safari 中点击「分享 -> 添加到主屏幕」体验更佳）。

---

### ⌨️ 快捷键

| 按键 | 功能说明 |
| :--- | :--- |
| `→` / `空格` / `PageDown` | 下一页 / 下一章（双页模式自动翻 2 页） |
| `←` / `PageUp` | 上一页 / 上一章（双页模式自动翻 2 页） |
| `D` | 切换单页 / 双页并排模式 |
| `M` | 切换分页模式 / 条漫瀑布流模式 |
| `F` | 切换全屏 |
| `ESC` | 关闭抽屉 / 返回书架 |

---

### 📌 关于本项目 (About)

本项目为 **Vibe Coding** 产物，旨在解决局域网内用平板/手机随心翻阅电脑本地漫画、画册、小说电子书和视频的痛点需求。
- **定位**：开箱即用、轻量无依赖冗余、单机自托管。
- **维护说明**：个人业余需求产物，**后期大概率不会进行高频更新与长期维护**。
- **二次开发**：代码结构轻量模块化，欢迎按需 Fork 和魔改！

---

## 🇺🇸 English README

A lightweight, high-performance local comic, manga, novel, and media reader designed for local network streaming on tablets (iPad/Android), phones, and desktops.

### 🌟 Key Features

- **📚 Universal Format Support**:
  - **Novels & E-books**: `.txt`, `.epub`, `.mobi`, `.azw3`, `.md` (Auto TOC, 4 themes, bookmarks, reading progress resume).
  - **Comics & Images**: `.zip`, `.cbz`, `.pdf`, `.jpg`, `.png`, `.webp`, `.gif`, `.avif`.
  - **Video Streaming**: `.mp4`, `.mkv`, `.webm`, `.avi`, `.mov` (Auto 1st-frame poster, HTTP Range 206 streaming).
- **🔍 Smart Fuzzy Search**: Case-insensitive, symbol-forgiving, multi-language global search for files, folders, and extensions.
- **📖 Dual-Page Spread**: Side-by-side open-book reading for desktop and landscape tablets with LTR/RTL support.
- **📱 Touch Gesture Engine**: Pinch-to-zoom, double-tap zoom, swipe navigation, and configurable tap zones.
- **🛡️ Sandbox Security**: Strict boundary enforcement to prevent path traversal outside configured bookshelf roots.
- **⚡ Weak Network Turbo Mode**: Real-time WebP compression and multi-page prefetching for lag-free reading over Wi-Fi.
- **🌐 Auto Port & i18n**: Multi-language support (English / 简体中文); automatic port incrementing (`7891`, `7892`...).

---

### 🚀 Quick Start

- **Windows**: Double-click `run.bat`
- **macOS / Linux**: `chmod +x run.sh && ./run.sh`
- **Manual**: `pip install -r requirements.txt && python run.py`

Connect via Wi-Fi from any tablet or mobile browser by entering your PC's LAN IP shown on the top-right menu.

---

### 📌 About & Disclaimer

This project is a **Vibe Coding** weekend project created to solve the personal itch of browsing local PC media wirelessly from iPad/Android devices.
- Designed to be zero-bloat, self-hosted, and ready to use out of the box.
- Future continuous updates and maintenance are **unlikely**. Feel free to fork and customize!
