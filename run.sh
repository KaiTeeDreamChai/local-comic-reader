#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "========================================================"
echo "       本地漫画与画册局域网浏览器 (Local Comic Reader)"
echo "========================================================"
echo ""

if [ ! -d "venv" ]; then
    echo "[1/3] 创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "[2/3] 安装依赖..."
pip install -r requirements.txt -q

echo "[3/3] 启动服务 (0.0.0.0:8000)..."
echo "服务已绑定 0.0.0.0:8000，局域网设备可通过本机 IP 访问。"
echo "========================================================"
echo ""

uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
