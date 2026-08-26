from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from .routers import api_router
from .auth import is_request_auth_required, is_request_authenticated

app = FastAPI(title="Local Comic & Media Reader", version="1.0.0")

# Enable CORS for local network and frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    # Allow static assets, index HTML, auth endpoints, system info, and favicon
    if (
        path == "/"
        or path.startswith("/static")
        or path.startswith("/api/auth")
        or path == "/api/info"
        or path == "/favicon.ico"
    ):
        return await call_next(request)

    # Intercept unauthenticated remote requests
    if is_request_auth_required(request):
        if not is_request_authenticated(request):
            return JSONResponse(
                status_code=401,
                content={
                    "detail": "检测到远程连接，请输入访问密码以继续",
                    "auth_required": True,
                    "is_remote": True
                }
            )

    return await call_next(request)

# Register modular routers
app.include_router(api_router)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

# Serve static frontend files
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def index():
        return FileResponse(FRONTEND_DIR / "index.html", headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        })

    @app.get("/{catch_all:path}")
    def fallback(catch_all: str):
        target_file = FRONTEND_DIR / catch_all
        if target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(FRONTEND_DIR / "index.html", headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        })
