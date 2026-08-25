from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from ..collections import (
    load_collections,
    toggle_favorite,
    toggle_read_later,
    create_category,
    rename_category,
    delete_category,
    toggle_category_item
)

router = APIRouter(prefix="/api/collections", tags=["Collections & Categories"])


class ItemPayload(BaseModel):
    item: Dict[str, Any]


class CategoryCreatePayload(BaseModel):
    name: str


class CategoryRenamePayload(BaseModel):
    category_id: str
    name: str


class CategoryDeletePayload(BaseModel):
    category_id: str


class CategoryItemPayload(BaseModel):
    category_id: str
    item: Dict[str, Any]


@router.get("/all")
async def get_all():
    return load_collections()


@router.post("/favorite")
async def handle_toggle_favorite(payload: ItemPayload):
    try:
        return toggle_favorite(payload.item)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/read_later")
async def handle_toggle_read_later(payload: ItemPayload):
    try:
        return toggle_read_later(payload.item)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/category/create")
async def handle_create_category(payload: CategoryCreatePayload):
    try:
        return create_category(payload.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/category/rename")
async def handle_rename_category(payload: CategoryRenamePayload):
    try:
        return rename_category(payload.category_id, payload.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/category/delete")
async def handle_delete_category(payload: CategoryDeletePayload):
    try:
        success = delete_category(payload.category_id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/category/toggle_item")
async def handle_toggle_category_item(payload: CategoryItemPayload):
    try:
        return toggle_category_item(payload.category_id, payload.item)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
