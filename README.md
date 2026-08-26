<div align="center">

# 📖 Local Comic Reader

**专为局域网与外网远程打造的轻量级漫画、小说与媒体流式阅读器**
<br />
*A lightweight, high-performance local & remote streaming reader for comics, e-books, and media across tablets, phones, and PCs.*

[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Modern%20Web-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square)](https://github.com/KaiTeeDreamChai/local-comic-reader)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Vibe Coding](https://img.shields.io/badge/Built%20with-Vibe%20Coding-blueviolet?style=flat-square)](https://github.com/KaiTeeDreamChai)

</div>

---

## 📌 项目简介

电脑硬盘里存了海量漫画、画集、轻小说电子书和短视频，但**想舒舒服服躺在床上用 iPad / 手机翻阅，甚至出门在外用 5G 流量也能随时随地看家里的收藏，却苦于传输繁琐、占用手机空间？**

`Local Comic Reader` 是一款无需复杂配置、开箱即用的跨端流媒体阅读器。电脑端一键启动，平板或手机直接通过浏览器访问，不仅支持同一 Wi-Fi 局域网高速浏览，更原生支持 **IPv6 公网直连 / DDNS 远程连接**，搭配密码安全锁屏、多端双页翻页、捏合缩放、分类收藏与视频流媒体点播体验。

---

## ✨ 核心功能与亮点

### 1. 🌐 IPv6 远程外网直连与安全防护 (新特性)
- **公网 IPv6 原生双栈直连**：自动识别电脑的公网 IPv6 地址，无需内网穿透公网中继，手机出门开启 5G/4G 流量即可极速直连家中的漫画库。
- **自定义动态域名绑定 (DDNS)**：支持绑定 `dynv6`、`DuckDNS` 等动态域名，自动生成专属便捷访问链接。
- **远程访问密码安全锁**：内置智能连接检测——当检测到来自公网/IPv6 的远程访问时，强制要求输入密码解锁；局域网（同一 Wi-Fi）支持配置免密直连。
- **多服务独立共存**：严格占用专属端口（默认 `7891`），与同一电脑上运行的 Minecraft 服务器（`25565`）、Web 等其他网络服务完全隔离并存，互不冲突。
- **Windows 防火墙一键放行**：内置 `allow_firewall.bat` 与网页端 **「🛡️ 一键放行 Windows 防火墙」** 工具，免去复杂的防火墙出入站配置。

### 2. 📱 移动端自适应与「弹出式操作菜单」 (新特性)
- **清爽顶部 HUD 栏**：移动端精简顶部控件，告别多按钮拥挤。
- **弹出式阅读操作菜单 (`•••`)**：右上角一键唤出毛玻璃悬浮操作面板，分类收纳常用功能：
  - ❤️ **收藏与分类**：一键收藏、稍后再看、管理自定义跨书架分类。
  - 📖 **阅读偏好**：翻页模式（单页/双页连页/瀑布流卷轴）、阅读方向（日漫 RTL / 普通 LTR）、小说字号（`A-` / `A+`）与 4 款阅读主题。
  - 🛠️ **快捷工具**：全屏阅读切换、整本漫画文件一键打包下载导出。

### 3. 🔖 多维视觉书签与目录智能定位 (新特性)
- **封面状态角标**：在书架目录中直接为已收藏（❤️ 红色角标）、已分类（📁 蓝色角标）、稍后再看（🕒 黄色角标）的作品展示醒目标签。
- **平滑记忆滚动**：从阅读器退出或返回上一级目录时，自动定位并平滑滚动到上一次点击的作品位置，无需再次费力翻找。

### 4. 📚 全媒体格式覆盖
- **小说 & 电子书**：`.txt`、`.epub`、`.mobi`、`.azw3`、`.md`（智能正则分章、4 款护眼主题、字号缩放、进度记忆、章节书签）。
- **漫画 & 图片集**：`.zip`、`.cbz`、`.pdf`、`.jpg`、`.png`、`.webp`、`.gif` (动图)、`.avif`。
- **视频即时点播**：`.mp4`、`.mkv`、`.webm`、`.avi`、`.mov`（首帧封面自动生成、HTTP Range 206 流式分片缓冲、±10s 快进快退）。

### 5. 📖 拟真阅读排版与触控体验
- 支持横屏/宽屏 **双页并排阅读**（完美还原实体书展开体验）。
- 专为 iPad Safari / Android 触屏调校，支持双指捏合缩放（Pinch-to-zoom）、双击放大、边缘热区分页。
- **秒级模糊检索**：跨语言、容错标点符号（括号/空格/后缀），秒级索引全库。
- **弱网 Wi-Fi Turbo 模式**：即时动态 WebP 压缩、前后多页前瞻预加载与本地磁盘缓存。

---

## 🔧 工作原理

```
[ 电脑端本地存储 (Comics / Novels / Videos) ]
       │
       ▼ (FastAPI / 图像解码 / 解压流 / HTTP Range 206)
[ 本地服务引擎 (Local Comic Server) ]
       │
       ├──► 实时解压与 WebP 动态压缩缓存
       ├──► 智能分章、元数据提取与模糊索引
       ├──► 局域网 + IPv6 双栈监听与多服务独立隔离
       └──► 远程连接安全检测与密码会话保护
       │
       ├──► (局域网 Wi-Fi 直连) ──► 平板 / 手机 / PC (免密高速)
       └──► (公网 IPv6 / dynv6) ──► 5G/4G 外网手机 (密码安全防护)
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

## 📱 多端访问与远程连接指南

### 1. 局域网 Wi-Fi 连接（iPad / 平板 / 手机）
1. 确保手机/平板与电脑连接在 **同一个 Wi-Fi** 下。
2. 打开电脑端阅读器，点击右上角 **「局域网设备」** 图标，查看局域网 IP（例如 `http://192.168.1.100:7891`）。
3. 手机/iPad 浏览器访问该地址即可。  
   *(💡 提示：在 iPad Safari 中点击「分享 ➔ 添加到主屏幕」，即可获得类似原生 App 的全屏沉浸体验)*。

### 2. 5G 手机外网远程连接 (IPv6 / dynv6)
1. **放行 Windows 防火墙**：
   - 在网页端「设置」⚙️ 中点击 **【一键放行 Windows 防火墙 (端口 7891)】**，或双击运行 `allow_firewall.bat`。
2. **设置远程密码**：
   - 在「设置」->「远程 IPv6 访问与安全」中开启密码保护并设置密码。
3. **手机 5G 直连**：
   - 手机关闭 Wi-Fi 开启 5G 数据流量，在浏览器中输入 `http://<您的dynv6域名>:7891`（例如 `http://mycomic.dynv6.net:7891`），输入密码即可随时随地畅读！
   *(⚠️ 注意：请确保以 `http://` 开头访问)*。

---

## ⌨️ 常用快捷键

| 按键 | 功能说明 |
| :--- | :--- |
| `→` / `空格` / `PageDown` | 下一页 / 下一章（双页模式自动翻 2 页） |
| `←` / `PageUp` | 上一页 / 上一章（双页模式自动翻 2 页） |
| `D` | 切换单页 / 双页并排模式 |
| `M` | 切换翻页阅读 / 条漫瀑布流模式 |
| `F` | 切换全屏模式 |
| `ESC` | 关闭侧边抽屉 / 弹出菜单 / 返回书架主页 |

---

## 🏗️ 项目结构

```
local-comic-reader/
├── backend/               # 后端服务 (FastAPI / 路由 / 解析引擎 / 缓存 / 鉴权)
│   ├── app.py             # FastAPI 核心主程序与静态挂载
│   ├── auth.py            # 远程访问鉴权与 Cookie 会话管理
│   ├── config.py          # 书架配置与持久化数据存储
│   ├── scanner.py         # 多格式媒体扫描与提取引擎
│   ├── utils.py           # 网络 IP/IPv6 探测与系统工具
│   └── routers/           # 模块化 API 路由 (comics / novel / system / auth / collections)
├── frontend/              # 前端单页应用 (Vue 3 / Tailwind CSS / 触控引擎)
│   ├── index.html         # 核心单页 HTML 骨架
│   ├── js/
│   │   ├── app.js         # Vue 3 应用主逻辑与状态调度
│   │   ├── i18n.js        # 中英双语多语言词典
│   │   ├── touch.js       # 触控手势与捏合缩放控制器
│   │   └── modules/       # 前端子模块 (comicReader / novelReader / api)
├── allow_firewall.bat     # Windows 防火墙一键放行脚本
├── run.py                 # 服务启动、双栈端口监听与环境自检入口
├── run.bat                # Windows 一键启动脚本
├── run.sh                 # macOS/Linux 启动脚本
└── requirements.txt       # Python 依赖清单
```

---

## ☕ 关于本项目 (About)

本项目为 **Vibe Coding** 产物，旨在解决局域网与外网远程用平板/手机随心翻阅电脑本地漫画、画册、小说和视频的痛点需求。
- **定位**：开箱即用、轻量无依赖冗余、单机自托管。
- **维护说明**：个人业余需求产物，后期按需维护更新。
- **二次开发**：代码结构轻量模块化，欢迎按需 Fork 和魔改！

---

## 📄 License

本项目基于 [MIT License](LICENSE) 开源。

