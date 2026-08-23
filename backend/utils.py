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
SUPPORTED_EXTENSIONS = IMAGE_EXTENSIONS | ARCHIVE_EXTENSIONS | PDF_EXTENSIONS


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


def get_local_ips() -> List[str]:
    """Retrieve all local network IP addresses for LAN access."""
    ips = []
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127.") and not ip.startswith("169.254."):
                ips.append(ip)
    except Exception:
        pass

    # Fallback method by opening a dummy UDP socket to an external address
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.1)
        s.connect(('8.8.8.8', 80))
        main_ip = s.getsockname()[0]
        s.close()
        if main_ip and main_ip not in ips and not main_ip.startswith("127."):
            ips.insert(0, main_ip)
    except Exception:
        pass

    if not ips:
        ips.append("127.0.0.1")
    return ips
