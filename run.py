import sys
import os
import socket
import subprocess
import webbrowser
import time
from pathlib import Path

# Ensure working directory is project root
ROOT_DIR = Path(__file__).resolve().parent
os.chdir(ROOT_DIR)

DEFAULT_PORT = 7891

REQUIRED_PACKAGES = {
    "fastapi": "fastapi",
    "uvicorn": "uvicorn",
    "fitz": "pymupdf",
    "PIL": "pillow",
    "natsort": "natsort",
    "multipart": "python-multipart"
}


def is_port_available(port: int, host: str = "0.0.0.0") -> bool:
    """Check if a specific port is free to bind."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind((host, port))
            return True
        except OSError:
            return False


def find_available_port(start_port: int = DEFAULT_PORT, max_tries: int = 100) -> int:
    """Find the next available port starting from start_port."""
    for port in range(start_port, start_port + max_tries):
        if is_port_available(port):
            return port
    return start_port


def check_and_install_dependencies():
    missing = []
    for module_name, pip_name in REQUIRED_PACKAGES.items():
        try:
            __import__(module_name)
        except ImportError:
            missing.append(pip_name)

    if missing:
        print("=" * 60)
        print(" [1/2] 检测到缺少必要的运行依赖，正在自动安装...")
        print(f" 待安装库: {', '.join(missing)}")
        print("=" * 60)
        
        cmd = [
            sys.executable, "-m", "pip", "install", 
            "-r", "requirements.txt",
            "-i", "https://pypi.tuna.tsinghua.edu.cn/simple"
        ]
        result = subprocess.run(cmd)
        if result.returncode != 0:
            # Fallback to default pypi if tuna fails
            print("\n镜像源下载失败，尝试官方源下载...")
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])


def start_server():
    from backend.utils import get_local_ips
    import uvicorn

    port = find_available_port(DEFAULT_PORT)
    if port != DEFAULT_PORT:
        print(f"\n[提示] 默认端口 {DEFAULT_PORT} 已被占用，已自动递增切换到可用端口: {port}")

    os.environ["PORT"] = str(port)
    ips = get_local_ips()

    print("\n" + "=" * 60)
    print("      本地漫画与画册局域网浏览器 (Local Comic Reader)")
    print("=" * 60)
    print(" [✓] 服务已成功启动！\n")
    print(f" 💻 本机电脑访问地址 (端口: {port}):")
    print(f"     👉 http://127.0.0.1:{port} 或 http://localhost:{port}\n")
    print(" 📱 局域网平板/手机 (iPad / Android) 访问地址 (需连接同一 Wi-Fi):")
    for ip in ips:
        print(f"     👉 http://{ip}:{port}")
    print("\n" + "-" * 60)
    print(" 提示: 按 Ctrl + C 可随时停止服务")
    print("=" * 60 + "\n")

    # Open browser automatically after a short delay
    def open_browser():
        time.sleep(1.2)
        webbrowser.open(f"http://127.0.0.1:{port}")

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    # Start uvicorn server with optimized concurrency settings
    uvicorn.run(
        "backend.app:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
        timeout_keep_alive=30,
        limit_concurrency=200,
        backlog=2048
    )


if __name__ == "__main__":
    try:
        check_and_install_dependencies()
        start_server()
    except KeyboardInterrupt:
        print("\n服务已安全退出。")
    except Exception as e:
        print(f"\n[错误] 启动失败: {e}")
        input("\n按回车键退出...")
