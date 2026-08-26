import hmac
import hashlib
import ipaddress
import secrets
import time
from typing import Optional, Dict, Any, Tuple
from fastapi import Request

from .config import load_config, save_config

TOKEN_MAX_AGE = 30 * 24 * 3600  # 30 days validity


def get_secret_key() -> str:
    """Retrieve or generate secret key for HMAC token signing."""
    cfg = load_config()
    secret = cfg.get("settings", {}).get("auth_secret_key", "")
    if not secret:
        secret = secrets.token_hex(32)
        if "settings" not in cfg:
            cfg["settings"] = {}
        cfg["settings"]["auth_secret_key"] = secret
        save_config(cfg)
    return secret


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hash password using PBKDF2-HMAC-SHA256 with salt."""
    if not salt:
        salt_bytes = secrets.token_bytes(16)
        salt = salt_bytes.hex()
    else:
        salt_bytes = bytes.fromhex(salt)
    
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_bytes, 100_000)
    return pwd_hash.hex(), salt


def verify_password(password: str) -> bool:
    """Verify input password against stored configuration hash."""
    cfg = load_config()
    settings = cfg.get("settings", {})
    stored_hash = settings.get("remote_password_hash", "")
    salt = settings.get("remote_password_salt", "")
    
    if not stored_hash or not salt:
        return False
        
    calc_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(stored_hash, calc_hash)


def set_new_password(password: str) -> None:
    """Save new password hash in config."""
    cfg = load_config()
    if "settings" not in cfg:
        cfg["settings"] = {}
        
    if not password.strip():
        # Clear password
        cfg["settings"]["remote_password_hash"] = ""
        cfg["settings"]["remote_password_salt"] = ""
    else:
        pwd_hash, salt = hash_password(password.strip())
        cfg["settings"]["remote_password_hash"] = pwd_hash
        cfg["settings"]["remote_password_salt"] = salt
        
    save_config(cfg)


def generate_auth_token() -> str:
    """Generate a signed HMAC auth token valid for TOKEN_MAX_AGE."""
    secret = get_secret_key()
    ts = int(time.time())
    nonce = secrets.token_hex(8)
    payload = f"{ts}.{nonce}"
    sig = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"cr_{payload}.{sig}"


def verify_auth_token(token: Optional[str]) -> bool:
    """Validate signature and expiration of an auth token."""
    if not token or not token.startswith("cr_"):
        return False
        
    try:
        secret = get_secret_key()
        body = token[3:]  # Strip "cr_"
        parts = body.split(".")
        if len(parts) != 3:
            return False
            
        ts_str, nonce, sig = parts
        payload = f"{ts_str}.{nonce}"
        expected_sig = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
        
        if not hmac.compare_digest(sig, expected_sig):
            return False
            
        ts = int(ts_str)
        if time.time() - ts > TOKEN_MAX_AGE:
            return False  # Expired
            
        return True
    except Exception:
        return False


def get_client_ip(request: Request) -> str:
    """Extract real client IP address from request."""
    # Check X-Forwarded-For
    xff = request.headers.get("x-forwarded-for")
    if xff:
        client_ip = xff.split(",")[0].strip()
        if client_ip:
            return client_ip
            
    # Check X-Real-IP
    x_real = request.headers.get("x-real-ip")
    if x_real:
        return x_real.strip()
        
    if request.client and request.client.host:
        return request.client.host
        
    return "127.0.0.1"


def is_local_ip(ip_str: str, allow_lan: bool = True) -> bool:
    """
    Classify whether an IP is considered local.
    - Loopback (127.0.0.1, ::1, localhost): Always local.
    - LAN Private / Link-Local: Local if allow_lan=True.
    - Public IPv4 / Global IPv6: Remote.
    """
    try:
        clean = ip_str.strip()
        if clean.lower() in ("localhost", "127.0.0.1", "::1", "::", "0.0.0.0"):
            return True

        if clean.startswith("[") and "]" in clean:
            clean = clean[1:clean.index("]")]
        elif ":" in clean and clean.count(":") == 1:
            clean = clean.split(":")[0]
            
        # Strip IPv6 zone ID if present
        clean = clean.split("%")[0]
        
        # Handle IPv4-mapped IPv6 address
        if clean.startswith("::ffff:"):
            clean = clean[7:]
            
        addr = ipaddress.ip_address(clean)
        
        if addr.is_loopback or addr.is_unspecified:
            return True
            
        if allow_lan:
            if addr.is_private or addr.is_link_local:
                return True
                
        return False
    except Exception:
        return False


def get_request_token(request: Request) -> Optional[str]:
    """Extract auth token from Cookie, Header, or Query Parameter."""
    # 1. Cookie
    token = request.cookies.get("comic_auth_token")
    if token:
        return token
        
    # 2. Header: X-Auth-Token or Authorization: Bearer <token>
    token = request.headers.get("x-auth-token")
    if token:
        return token
        
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
        
    # 3. Query Param (used for video/image streams)
    token = request.query_params.get("auth_token")
    if token:
        return token
        
    return None


def is_request_auth_required(request: Request) -> bool:
    """Determine whether authentication is required for this request."""
    cfg = load_config()
    settings = cfg.get("settings", {})
    
    remote_auth_enabled = settings.get("remote_auth_enabled", True)
    has_password = bool(settings.get("remote_password_hash"))
    lan_bypass = settings.get("lan_bypass_auth", True)
    
    # If remote auth is disabled or no password is set, no auth required
    if not remote_auth_enabled or not has_password:
        return False
        
    client_ip = get_client_ip(request)
    # If client is local (or LAN when lan_bypass is True), no auth required
    if is_local_ip(client_ip, allow_lan=lan_bypass):
        return False
        
    return True


def is_request_authenticated(request: Request) -> bool:
    """Check if request is authenticated (either local client or valid token)."""
    if not is_request_auth_required(request):
        return True
        
    token = get_request_token(request)
    return verify_auth_token(token)
