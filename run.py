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
    "pymupdf": "pymupdf",
    "PIL": "pillow",
    "natsort": "natsort",
    "multipart": "python-multipart"
}


def is_port_available(port: int, host: str = "::") -> bool:
    """Check if a specific port is free to bind (dual-stack IPv6/IPv4)."""
    # 1. Try dual-stack IPv6
    try:
        with socket.socket(socket.AF_INET6, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
            except (AttributeError, OSError):
                pass
            s.bind((host, port))
            return True
    except Exception:
        pass

    # 2. Fallback to IPv4 check
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(("0.0.0.0", port))
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


def create_server_sockets(port: int) -> list:
    """Create listening sockets for both IPv4 and IPv6 (dual-stack)."""
    # 1. Try single dual-stack socket with explicit IPV6_V6ONLY = 0 (Crucial for Windows dual-stack)
    try:
        sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except Exception:
            pass
        sock.bind(("::", port))
        sock.listen(2048)
        return [sock]
    except Exception:
        pass

    # 2. Fallback: bind separate IPv4 and IPv6 sockets
    sockets = []
    # IPv4 Socket (0.0.0.0)
    try:
        s4 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s4.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s4.bind(("0.0.0.0", port))
        s4.listen(2048)
        sockets.append(s4)
    except Exception as e:
        print(f"[警告] IPv4 端口绑定异常: {e}")

    # IPv6 Socket (:: with IPV6_V6ONLY = 1)
    try:
        s6 = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        s6.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s6.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 1)
        except Exception:
            pass
        s6.bind(("::", port))
        s6.listen(2048)
        sockets.append(s6)
    except Exception as e:
        print(f"[警告] IPv6 端口绑定异常: {e}")

    if not sockets:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("0.0.0.0", port))
        s.listen(2048)
        sockets.append(s)

    return sockets


def ensure_windows_firewall_rule(port: int):
    """Attempt to add Windows Defender Firewall rule automatically if on Windows."""
    if sys.platform != "win32":
        return
    try:
        check_cmd = ["netsh", "advfirewall", "firewall", "show", "rule", f"name=ComicReader-{port}"]
        res = subprocess.run(check_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout_bytes = res.stdout or b""
        if f"ComicReader-{port}".encode("ascii") not in stdout_bytes:
            add_cmd = [
                "netsh", "advfirewall", "firewall", "add", "rule",
                f"name=ComicReader-{port}", "dir=in", "action=allow",
                "protocol=TCP", f"localport={port}", "profile=any",
                "description=Allow Comic Reader IPv4 and IPv6 inbound access"
            ]
            subprocess.run(add_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except Exception:
        pass


def start_server():
    from backend.utils import get_server_network_info
    from backend.config import load_config
    import uvicorn

    port = find_available_port(DEFAULT_PORT)
    if port != DEFAULT_PORT:
        print(f"\n[提示] 默认端口 {DEFAULT_PORT} 已被占用，已自动递增切换到可用端口: {port}")

    os.environ["PORT"] = str(port)
    ensure_windows_firewall_rule(port)

    net_info = get_server_network_info()
    ipv4_list = net_info.get("ipv4", [])
    ipv6_list = net_info.get("ipv6", [])
    
    cfg = load_config()
    custom_domain = cfg.get("settings", {}).get("custom_domain", "").strip()

    # Pre-bind listening sockets with explicit IPv4 + IPv6 dual stack
    sockets = create_server_sockets(port)

    print("\n" + "=" * 64)
    print("      本地漫画与画册多端远程阅读器 (Local Comic Reader)")
    print("=" * 64)
    print(" [✓] 服务已成功启动 (IPv4 / IPv6 双栈均已就绪)！\n")
    print(f" 💻 本机电脑访问地址 (端口: {port}):")
    print(f"     👉 http://127.0.0.1:{port} 或 http://localhost:{port}\n")
    
    if custom_domain:
        print(f" 🌐 自定义动态域名直连 (dynv6 / DDNS):")
        print(f"     👉 http://{custom_domain}:{port}\n")

    if ipv4_list:
        print(" 📱 局域网平板/手机访问地址 (需连接同一 Wi-Fi):")
        for ip in ipv4_list:
            print(f"     👉 http://{ip}:{port}")
        print()

    if ipv6_list:
        print(" 🌐 远程 IPv6 外网直连访问地址 (支持 5G/4G 手机流量及异地访问):")
        for ip in ipv6_list:
            print(f"     👉 http://[{ip}]:{port}")
        print("     🔒 安全提示: 检测到远程连接时将自动要求密码验证\n")

    print("-" * 64)
    print(" 💡 远程 5G/外网访问排查提示 (若手机提示响应超时 ERR_CONNECTION_TIMED_OUT):")
    print("    1. Windows 防火墙: 请右键【以管理员身份运行】 allow_firewall.bat 放行端口 7891")
    print("    2. 路由器 IPv6 防火墙: 请登录 Wi-Fi 路由器后台 (如 192.168.1.1) 关闭【IPv6 防火墙】")
    print("    3. dynv6 域名解析: 确保 dynv6 解析地址与上方公网 IPv6 一致")
    print("-" * 64)
    print(" 提示: 按 Ctrl + C 可随时停止服务")
    print("=" * 64 + "\n")

    # Open browser automatically after a short delay
    def open_browser():
        time.sleep(1.2)
        webbrowser.open(f"http://127.0.0.1:{port}")

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    # Start uvicorn server with pre-bound dual-stack sockets
    config = uvicorn.Config(
        "backend.app:app",
        port=port,
        reload=False,
        log_level="info",
        timeout_keep_alive=30,
        limit_concurrency=200,
        backlog=2048
    )
    server = uvicorn.Server(config)
    server.run(sockets=sockets)


if __name__ == "__main__":
    try:
        check_and_install_dependencies()
        start_server()
    except KeyboardInterrupt:
        print("\n服务已安全退出。")
    except Exception as e:
        print(f"\n[错误] 启动失败: {e}")
        input("\n按回车键退出...")
