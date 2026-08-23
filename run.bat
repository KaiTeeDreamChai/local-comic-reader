@echo off
chcp 65001 >nul
title 本地漫画与画册局域网浏览器

echo ========================================================
echo        本地漫画与画册局域网浏览器 (Windows 11)
echo ========================================================
echo.

cd /d "%~dp0"

REM 检查 Python 环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3.9+ 并勾选 "Add to PATH"。
    pause
    exit /b 1
)

REM 创建并激活虚拟环境 (可选/自动)
if not exist "venv" (
    echo [1/3] 正在创建 Python 虚拟环境...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo [2/3] 检查并安装依赖库...
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --quiet

echo [3/3] 正在启动本地服务...
echo.
echo ========================================================
echo 服务启动后，可以在本机或局域网内的手机/平板浏览器中访问。
echo 按 Ctrl + C 可以停止服务。
echo ========================================================
echo.

start "" "http://127.0.0.1:8000"
uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload

pause
