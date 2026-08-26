import base64
import os
import re
import socket
from typing import List

try:
    import natsort
    def natural_sort_key(s: str):
        return natsort.natsort_keygen(key=lambda x: str(x).lower())(s)
except ImportError:
    def natural_sort_key(s: str):
        return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(s))]


IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif'}
ARCHIVE_EXTENSIONS = {'.zip', '.cbz'}
PDF_EXTENSIONS = {'.pdf'}
VIDEO_EXTENSIONS = {'.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv', '.wmv', '.m4v', '.ts'}
BOOK_EXTENSIONS = {'.txt', '.epub', '.mobi', '.azw3', '.md', '.log', '.srt'}
SUPPORTED_EXTENSIONS = IMAGE_EXTENSIONS | ARCHIVE_EXTENSIONS | PDF_EXTENSIONS | VIDEO_EXTENSIONS | BOOK_EXTENSIONS


def encode_path(path_str: str) -> str:
    """Encode path to URL-safe base64 string."""
    return base64.urlsafe_b64encode(path_str.encode('utf-8')).decode('utf-8')


def decode_path(encoded_str: str) -> str:
    """Decode URL-safe base64 string to original path."""
    try:
        padded = encoded_str + '=' * (-len(encoded_str) % 4)
        return base64.urlsafe_b64decode(padded.encode('utf-8')).decode('utf-8')
    except Exception as e:
        raise ValueError(f"无效或不可用的路径编码: {str(e)}")


import ipaddress

def get_server_network_info() -> dict:
    """Retrieve all local IPv4 and global/public IPv6 addresses."""
    ipv4_list = []
    ipv6_list = []
    
    # 1. Via socket getaddrinfo
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None):
            family, _, _, _, sockaddr = info
            ip = sockaddr[0]
            if family == socket.AF_INET:
                if not ip.startswith("127.") and not ip.startswith("169.254."):
                    if ip not in ipv4_list:
                        ipv4_list.append(ip)
            elif family == socket.AF_INET6:
                clean_ip = ip.split('%')[0]
                try:
                    addr = ipaddress.ip_address(clean_ip)
                    # Include global unicast IPv6 addresses (exclude loopback, link-local, unspecified)
                    if not addr.is_loopback and not addr.is_link_local and not addr.is_unspecified:
                        if clean_ip not in ipv6_list:
                            ipv6_list.append(clean_ip)
                except Exception:
                    pass
    except Exception:
        pass

    # 2. UDP socket probing for primary IPv4
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.1)
        s.connect(('8.8.8.8', 80))
        main_v4 = s.getsockname()[0]
        s.close()
        if main_v4 and main_v4 not in ipv4_list and not main_v4.startswith("127."):
            ipv4_list.insert(0, main_v4)
    except Exception:
        pass

    # 3. UDP socket probing for primary IPv6 if available
    try:
        s6 = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM)
        s6.settimeout(0.1)
        s6.connect(('2001:4860:4860::8888', 80))
        main_v6 = s6.getsockname()[0].split('%')[0]
        s6.close()
        addr = ipaddress.ip_address(main_v6)
        if not addr.is_loopback and not addr.is_link_local and not addr.is_unspecified:
            if main_v6 not in ipv6_list:
                ipv6_list.insert(0, main_v6)
    except Exception:
        pass

    if not ipv4_list:
        ipv4_list.append("127.0.0.1")

    return {
        "ipv4": ipv4_list,
        "ipv6": ipv6_list
    }


def get_local_ips() -> List[str]:
    """Retrieve all local network IP addresses for LAN access."""
    return get_server_network_info()["ipv4"]
