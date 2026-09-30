# 🌟 GEMINI.md — Gemini Agent 项目指引与协同守则

> **面向对象**：Gemini / Google Antigravity / Jules 等所有 Google AI Agent 及衍生助手。  
> **核心原则**：轻量无构建链、安全边界优先、双栈网络防御、**改动必留痕 (PROGRESS.md 同步守则)**。

---

## 一、 快速指引与上下文索引

在接手本项目的任何编码或分析任务时，请优先查阅以下核心文档：

- 🤖 **[AGENTS.md](AGENTS.md)**：系统的全局架构、模块设计、无构建前端规范、防御性编程与避坑指南。
- 📈 **[PROGRESS.md](PROGRESS.md)**：项目进度全景、功能矩阵、当前版本节点与**每次变更的详细历史记录**。
- 📖 **[README.md](README.md)**：终端用户快速上手手册、功能亮点与 IPv6/DDNS 配置说明。

---

## 二、 核心开发约束 (Golden Rules)

1. **Zero-Build 前端契约**：严禁引入 Node.js/npm 打包流程。所有前端逻辑直接运行于本地离线分发的 Vue 3 与 Tailwind CSS 运行时中。
2. **路径安全沙箱**：文件路径使用 URL-safe Base64 传递，必须调用 `is_path_allowed` 验证书架白名单根目录，严防目录穿越。
3. **Windows 编码防御**：所有 `subprocess` 调用必须显式指定 `errors='replace'`，防止中文环境下的 GBK 解码致命崩溃。
4. **双栈与远程安全**：保持 `7891` 端口 IPv4/IPv6 双栈监听；远程 IP 访问严格走密码锁屏鉴权。

---

## 三、 强制规则：每次修改必在 PROGRESS.md 留痕

作为 Gemini Agent，你必须严格遵守如下工作守则：

> 🚨 **每次对项目做出修改、功能推进或 Bug 修复后，必须立即在 [PROGRESS.md](PROGRESS.md) 中进行完整、详细的记录！**

### 记录内容清单：
1. **更新头部元数据**：同步更新 `PROGRESS.md` 中的 `> **最后更新时间**` 与版本号；
2. **更新功能矩阵**：在「二、 已完成功能清单」或对应章节勾选/追加完成状态；
3. **在「五、 变更与演进记录 (Changelog & Audit Log)」中详细登记**：
   - **日期与负责人**：标注日期与 `[Gemini Agent]`；
   - **变更类型**：`Feature` / `Bugfix` / `Refactor` / `Docs` / `Perf`；
   - **涉及文件**：明确列出修改或新增的文件相对路径；
   - **改动说明与设计决策**：清晰描述为什么修改、具体做了什么、改动影响的模块；
   - **测试验证**：说明验证方式与测试通过结果。
