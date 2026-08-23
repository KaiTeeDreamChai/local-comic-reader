from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .routers import api_router

app = FastAPI(title="Local Comic & Media Reader", version="1.0.0")

# Enable CORS for local network and frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(api_router)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

# Serve static frontend files
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def index():
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/{catch_all:path}")
    def fallback(catch_all: str):
        target_file = FRONTEND_DIR / catch_all
        if target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(FRONTEND_DIR / "index.html")
