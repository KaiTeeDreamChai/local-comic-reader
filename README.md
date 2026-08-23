<div align="center">

# 📖 Local Comic Reader

**专为局域网打造的轻量级漫画、小说与媒体流式阅读器**
<br />
*A lightweight, high-performance local network streaming reader for comics, e-books, and media across tablets, phones, and PCs.*

[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Modern%20Web-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square)](https://github.com/KaiTeeDreamChai/local-comic-reader)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Vibe Coding](https://img.shields.io/badge/Built%20with-Vibe%20Coding-blueviolet?style=flat-square)](https://github.com/KaiTeeDreamChai)

</div>

---

## 📌 项目简介

电脑硬盘里存了大量漫画、画集、轻小说电子书和短视频，但**想舒舒服服躺在床上用 iPad / 平板 / 手机翻阅，却苦于传输繁琐、占用平板空间？**

`Local Comic Reader` 是一款无需复杂配置、开箱即用的局域网流媒体阅读器。电脑端一键启动，平板或手机直接通过浏览器访问，即可享受无缝的双页翻页、捏合缩放、小说排版与视频流媒体播放体验。

---

## ✨ 核心特性

- 📚 **全媒体格式覆盖**：
  - **小说 & 电子书**：`.txt`、`.epub`、`.mobi`、`.azw3`、`.md`（智能目录提取、4 款护眼主题、字号缩放、记忆续读）。
  - **漫画 & 图片集**：`.zip`、`.cbz`、`.pdf`、`.jpg`、`.png`、`.webp`、`.gif` (动图)、`.avif`。
  - **视频即时点播**：`.mp4`、`.mkv`、`.webm`、`.avi`、`.mov`（首帧封面自动生成、HTTP Range 206 流式分片缓冲）。
- 📖 **拟真阅读排版**：
  - 支持横屏/电脑端 **双页并排阅读**（完美还原实体书展开体验）。
  - 支持 **从左至右 (LTR)** 与 **日漫从右至左 (RTL)** 阅读顺序，以及条漫无限滚动模式。
- 📱 **触控手势深度优化**：专为 iPad Safari / Android 触屏调校，支持双指捏合缩放、双击放大、边缘热区分页。
- 🔍 **秒级模糊全局检索**：跨语言、容错标点符号（括号/空格/后缀），秒级索引电脑书架全库。
- ⚡ **弱网 Wi-Fi Turbo 模式**：即时动态 WebP 压缩、前后多页前瞻预加载与本地磁盘缓存，防卡顿秒翻。
- 🛡️ **安全沙箱机制**：多盘符可视化管理，严格限制在指定书架根路径内，杜绝越权访问系统文件。
- 🌐 **双语支持与端口自适应**：内置中英界面切换；端口冲突时自动顺延递增（`7891`, `7892`...）。

---

## 🔧 工作原理

```
[ 电脑端本地存储 (Comics / Novels / Videos) ]
       │
       ▼ (FastAPI / 图像处理 / 解压流 / HTTP Range 206)
[ 本地服务引擎 (Local Comic Server) ]
       │
       ├──► 实时解压与 WebP 动态压缩缓存
       ├──► 智能分章、元数据提取与模糊索引
       └──► 局域网端口广播与安全沙箱防护
       │
       ▼ (Wi-Fi 局域网流式传输)
[ 移动设备 / 浏览器 (iPad / Android 平板 / 手机 / PC) ] 
       └──► 触控手势引擎 + 双页/条漫渲染
```

---

## 🚀 快速开始

### 方式一：Windows 11 一键运行（推荐）
双击仓库根目录下的 **`run.bat`** 即可（自动检测 Python 依赖、分配可用端口并在默认浏览器中弹出）。

### 方式二：macOS / Linux 脚本运行
```bash
chmod +x run.sh
./run.sh
```

### 方式三：手动运行
```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动服务
python run.py
```

---

## 📱 局域网设备连接（iPad / 平板 / 手机）

1. 确保移动设备与电脑连接在 **同一个 Wi-Fi** 下。
2. 电脑网页端右上角点击 **「局域网设备」** 图标，查看当前 IP 地址（例如 `http://192.168.1.100:7891`）。
3. 用 iPad / 手机的浏览器访问该地址即可开始阅读。  
   *(💡 提示：在 iPad Safari 中点击「分享 ➔ 添加到主屏幕」，即可获得如同原生 App 的全屏沉浸体验)*。

---

## ⌨️ 常用快捷键

| 按键 | 功能说明 |
| :--- | :--- |
| `→` / `空格` / `PageDown` | 下一页 / 下一章（双页模式自动翻 2 页） |
| `←` / `PageUp` | 上一页 / 上一章（双页模式自动翻 2 页） |
| `D` | 切换单页 / 双页并排模式 |
| `M` | 切换翻页阅读 / 条漫瀑布流模式 |
| `F` | 切换全屏模式 |
| `ESC` | 关闭侧边抽屉 / 返回书架主页 |

---

## 🏗️ 项目结构

```
local-comic-reader/
├── backend/          # 后端服务 (FastAPI / 路由 / 解析引擎 / 缓存)
├── frontend/         # 前端页面 (轻量原生 JS / CSS / 触控手势引擎)
├── run.py            # 服务启动与自动端口管理入口
├── run.bat           # Windows 一键启动脚本
├── run.sh            # macOS/Linux 启动脚本
└── requirements.txt  # Python 依赖清单
```

---

## ☕ 关于本项目 (About)

本项目为 **Vibe Coding** 产物，旨在解决局域网内用平板/手机随心翻阅电脑本地漫画、画册、小说和视频的痛点需求。
- **定位**：开箱即用、轻量无依赖冗余、单机自托管。
- **维护说明**：个人业余需求产物，后期大概率按需维护，不承诺长期功能迭代。
- **二次开发**：代码结构轻量模块化，欢迎按需 Fork 和魔改！

---

## 📄 License

本项目基于 [MIT License](LICENSE) 开源。
