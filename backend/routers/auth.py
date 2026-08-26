from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..config import load_config, save_config
from ..auth import (
    get_client_ip,
    is_local_ip,
    is_request_auth_required,
    is_request_authenticated,
    verify_password,
    set_new_password,
    generate_auth_token,
    verify_auth_token,
    get_request_token,
    TOKEN_MAX_AGE
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Security"])


class LoginRequest(BaseModel):
    password: str
    remember: Optional[bool] = True


class AuthConfigUpdate(BaseModel):
    remote_auth_enabled: Optional[bool] = None
    lan_bypass_auth: Optional[bool] = None
    new_password: Optional[str] = None
    old_password: Optional[str] = None


@router.get("/status")
def get_auth_status(request: Request):
    """Retrieve current client authentication and security status."""
    cfg = load_config()
    settings = cfg.get("settings", {})
    
    remote_auth_enabled = settings.get("remote_auth_enabled", True)
    has_password = bool(settings.get("remote_password_hash"))
    lan_bypass = settings.get("lan_bypass_auth", True)
    
    client_ip = get_client_ip(request)
    is_local = is_local_ip(client_ip, allow_lan=lan_bypass)
    is_remote = not is_local
    
    auth_required = is_request_auth_required(request)
    is_authenticated = is_request_authenticated(request)
    
    return {
        "client_ip": client_ip,
        "is_local": is_local,
        "is_remote": is_remote,
        "auth_required": auth_required,
        "is_authenticated": is_authenticated,
        "has_password": has_password,
        "remote_auth_enabled": remote_auth_enabled,
        "lan_bypass_auth": lan_bypass
    }


@router.post("/login")
def login(payload: LoginRequest, response: Response, request: Request):
    """Authenticate remote user with password."""
    cfg = load_config()
    settings = cfg.get("settings", {})
    has_password = bool(settings.get("remote_password_hash"))
    
    if not has_password:
        # If no password has been configured yet, accept any login and set as initial password
        if payload.password.strip():
            set_new_password(payload.password.strip())
        else:
            raise HTTPException(status_code=400, detail="密码不能为空")
    else:
        if not verify_password(payload.password):
            raise HTTPException(status_code=401, detail="密码错误，请重新输入")
            
    token = generate_auth_token()
    
    # Set cookie (30 days if remember, or session cookie)
    max_age = TOKEN_MAX_AGE if payload.remember else None
    response.set_cookie(
        key="comic_auth_token",
        value=token,
        max_age=max_age,
        httponly=False,
        samesite="lax",
        path="/"
    )
    
    return {
        "status": "success",
        "message": "验证成功",
        "token": token,
        "client_ip": get_client_ip(request)
    }


@router.post("/logout")
def logout(response: Response):
    """Clear client auth session cookie."""
    response.delete_cookie(key="comic_auth_token", path="/")
    return {"status": "success", "message": "已退出登录"}


@router.post("/config")
def update_auth_config(payload: AuthConfigUpdate, request: Request):
    """Update remote access password and security preferences."""
    cfg = load_config()
    settings = cfg.get("settings", {})
    has_password = bool(settings.get("remote_password_hash"))
    client_ip = get_client_ip(request)
    is_host = is_local_ip(client_ip, allow_lan=False)  # Is from loopback on host machine
    
    # If client is remote/LAN (not host machine) and password is set, require old password
    if has_password and not is_host and payload.new_password is not None:
        if not payload.old_password or not verify_password(payload.old_password):
            raise HTTPException(status_code=403, detail="原密码不正确，无法修改安全设置")
            
    if payload.new_password is not None:
        set_new_password(payload.new_password)
        # Reload after setting password
        cfg = load_config()
        settings = cfg.get("settings", {})
        
    if payload.remote_auth_enabled is not None:
        settings["remote_auth_enabled"] = payload.remote_auth_enabled
        
    if payload.lan_bypass_auth is not None:
        settings["lan_bypass_auth"] = payload.lan_bypass_auth
        
    cfg["settings"] = settings
    save_config(cfg)
    
    return {
        "status": "success",
        "message": "安全设置已更新",
        "settings": {
            "remote_auth_enabled": settings.get("remote_auth_enabled", True),
            "lan_bypass_auth": settings.get("lan_bypass_auth", True),
            "has_password": bool(settings.get("remote_password_hash"))
        }
    }
