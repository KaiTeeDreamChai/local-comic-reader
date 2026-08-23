from fastapi import APIRouter
from .system import router as system_router
from .library import router as library_router
from .comic import router as comic_router
from .video import router as video_router

api_router = APIRouter()

api_router.include_router(system_router)
api_router.include_router(library_router)
api_router.include_router(comic_router)
api_router.include_router(video_router)
