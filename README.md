# 本地漫画、画册与视频局域网浏览器 (Local Comic & Media Reader)

[English](#-english-readme) | [中文说明](#-中文说明)

---

## 🇨🇳 中文说明

专为 Windows 11 及跨平台系统设计的轻量级、高性能漫画、画册与媒体 Web 浏览器，专为触屏设备（iPad、Android 平板、手机、Surface）深度优化，支持局域网无线畅读畅看电脑本地的画册漫画与各类视频。

---

### 🌟 核心功能

1. **多格式无缝支持与动图/视频播放**：
   - **漫画画册与动图**：`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` (动态GIF流畅播放), `.bmp`, `.avif`
   - **压缩包漫画**：`.zip`, `.cbz`（无需手动解压，极速在线解包读取）
   - **PDF 漫画/画册**：`.pdf`（基于 PyMuPDF 引擎，高精度实时渲染单页为高清 WebP）
   - **🎬 常见视频格式播放**：`.mp4`, `.mkv`, `.webm`, `.avi`, `.mov`, `.flv`, `.wmv`, `.m4v`, `.ts`（自动截取视频第 1 帧作为海报封面；支持 HTTP Range 分段流式传输，在弱网优化开启时平滑缓冲，告别卡顿）
2. **文件名自然排序 (Natural Sort)**：
   - 彻底解决普通系统 `1, 10, 2` 的乱序问题，自动按 `1.jpg, 2.jpg, 10.jpg, 100.jpg` 顺序排布，章节阅读无断层。
3. **书架安全沙箱与目录层级保护**：
   - 在网页端可视化添加/移除电脑上的漫画根目录（支持多盘符，如 `D:\Comics`, `E:\画集`）。
   - **安全边界限制**：严格限制只在已设置的书架目录及其子目录内浏览，禁止突破书架向上越权访问电脑其他私人系统目录。
   - 支持多层级嵌套目录：`书架 -> 作品名 (系列) -> 卷/话 -> 单页`，并自动生成缩略图封面墙。
4. **触屏与移动设备极致优化**：
   - **触控手势 (Pointer Events)**：支持左右滑动翻页、双击放大、两指捏合缩放 (Pinch-to-zoom)、拖拽平移，完美兼容 Android 16+ 与最新版 Chrome / iOS Safari。
   - **智能多区域触控映射**：
     - 单页模式：左侧 20% 翻页、中间 60% 呼出菜单、右侧 20% 翻页。
     - 双页模式：直接点击左/右两面即可进行翻页，中间中缝零间隙贴合。
   - **双阅读模式与双页并排（跨页浏览）**：
     - **分页模式**：支持国漫/画册（左至右 LTR）与日漫（右至左 RTL）一键切换。
     - **📖 横屏/桌面端双页并排**：当识别到移动端横屏或桌面端宽屏时，开放「双页显示」开关，同一屏幕并排渲染两面漫画，并完美适配 LTR / RTL 翻页与排版顺序。
     - **条漫瀑布流模式**：长图无限向下滚动。
   - **阅读辅助**：自动保存每本漫画上次阅读的页码，智能静默预加载后几页，无感翻页。
   - **全屏模式**：一键进入沉浸式全屏浏览。
5. **🌐 完整中英文国际化支持 (i18n)**：
   - 设置面板中支持一键切换「简体中文」与「English」，界面文字、提示与设置说明即时无缝切换。
6. **局域网共享与智能端口冲突检测**：
   - 服务绑定 `0.0.0.0`，默认运行在 **`7891`** 端口。
   - **自动端口递增检测**：启动时若检测到 `7891` 端口已被其他软件占用，会自动在 `7891` 基础上 `+1`（如 `7892`、`7893`...）顺延寻找可用端口启动，无需手动修改端口配置。
   - 首页一键查看局域网 IP 与平板连接地址。
7. **⚡ 弱网加速优化模式**：
   - 网页右上角支持一键开启/关闭「弱网加速」功能。
   - 开启后自动启用智能 WebP 高效无损压缩与分辨率自适应，在保证肉眼高清画质的同时大幅削减传输体积。
   - 配合前向 4 页 + 后向 2 页的深度前瞻性预加载与高速磁盘缓存，即使在弱网 Wi-Fi 下也能秒开翻页，并大幅提升视频加载流畅度。
8. **📦 漫画一键打包下载**：
   - 支持在漫画封面或阅读器内一键将漫画（文件夹/CBZ/PDF）打包下载为 `.zip` 压缩包到客户端本地。

---

## 🚀 快速启动

### 方式一：Windows 11 一键启动（推荐）
1. 确保电脑已安装 Python 3.9+（安装时勾选 **Add Python to PATH**）。
2. 双击运行项目根目录下的 **`run.bat`**。
3. 脚本会自动检测依赖、分配可用端口并启动服务，自动在默认浏览器中打开。

### 方式二：Mac / Linux 启动
```bash
chmod +x run.sh
./run.sh
```

### 方式三：手动命令行启动
```bash
# 1. 创建并激活虚拟环境（可选）
python3 -m venv venv
source venv/bin/activate   # Windows 上运行: venv\Scripts\activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 运行启动入口（包含依赖检测与智能端口递增检测）
python run.py
```

---

## 📱 平板 / 手机（iPad / Android）局域网连接方法

1. 确保手机/平板与运行该程序的电脑连接在同一个 **Wi-Fi（局域网）** 下。
2. 在电脑端网页点击右上角的 **“设备连接”** 图标（手机图标），查看本机局域网地址（例如 `http://192.168.1.100:7891`）。
3. 在 iPad / 手机的 Safari 或 Chrome 浏览器中输入该网址即可。
4. **推荐**：在 iPad 的 Safari 中点击“分享” -> “添加到主屏幕”，即可像原生 App 一样全屏无边框浏览。

---

## ⌨️ 电脑键盘快捷键

- `→` / `空格` / `PageDown`：下一页（双页模式下自动跳2页）
- `←` / `PageUp`：上一页（双页模式下自动跳2页）
- `D`：切换单页 / 双页并排模式（需横屏或桌面端）
- `F`：切换全屏
- `M`：切换分页模式 / 条漫瀑布流模式
- `ESC`：关闭预览抽屉 / 退出阅读器返回书架

---

## 📌 备注 (Disclaimer)

本项目为 **Vibe Coding** 出来的小玩具/个人业余需求产物，旨在满足在局域网内使用平板与手机等触屏设备顺畅翻阅电脑本地画册漫画与视频的小痛点。项目功能以开箱即用、简单好使为目的，**后期持续更新与维护的概率不大**。代码结构简洁明了，非常欢迎有进阶需求的朋友自行 Fork 和魔改！🍵

---

## 🇺🇸 English README

A lightweight, high-performance local comic, manga, album and media web reader designed for Windows 11 and cross-platform systems. Optimized specifically for touchscreen devices (iPad, Android tablets, phones, Surface) to wirelessly browse your PC library over LAN.

### 🌟 Key Highlights

- **Multi-Format & Media Playback**: Supports `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` (animated GIF playback), `.bmp`, `.avif`, `.zip`, `.cbz`, `.pdf` (high-DPI PyMuPDF render), and popular videos `.mp4`, `.mkv`, `.webm`, `.avi`, `.mov`, `.flv`, `.wmv`, `.m4v`, `.ts` (with auto 1st frame cover and HTTP Range chunk streaming).
- **Natural Alphanumeric Sorting**: Proper sorting for numbered pages (`1, 2, 10, 100`).
- **Bookshelf Boundary Sandbox**: Strict directory boundary enforcement to prevent navigating outside configured bookshelves.
- **Dual-Page Spread (Desktop & Landscape Mobile)**: Side-by-side open book viewing with zero spine gap and smart LTR / RTL manga reading directions.
- **Touch Gesture Control (Pointer Events)**: Smooth 2-finger pinch-to-zoom (1.0x - 4.0x), pan dragging, double-tap zoom, and 20% edge tap zones.
- **Bilingual Interface (i18n)**: Switch between Simplified Chinese (简体中文) and English in the settings panel with one click.
- **⚡ Weak Network Turbo Mode**: On-the-fly WebP compression, deep page preloading, and smooth video buffering.
- **📦 One-Click ZIP Download**: Package and download comics or albums as `.zip` directly to your client.
- **LAN Auto Port Detection**: Automatically finds open ports starting from `7891` (`7891`, `7892`, etc.).

### 🚀 Quick Start
```bash
# Windows 11
Double-click run.bat

# macOS / Linux
chmod +x run.sh && ./run.sh
```
