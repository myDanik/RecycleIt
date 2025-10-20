from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List


router = APIRouter()


@router.get("/")
async def list_points(waste_type: Optional[str] = Query(None), open_now: Optional[bool] = Query(None), page: int = 1, size: int = 20):
    raise HTTPException(status_code=501, detail="Not implemented: list_points")


@router.get("/{point_id}")
async def get_point(point_id: int):
    raise HTTPException(status_code=501, detail="Not implemented: get_point")   


@router.get("/search")
async def search_points(q: Optional[str] = Query(None), waste_types: Optional[List[str]] = Query(None), open_from: Optional[str] = Query(None), open_to: Optional[str] = Query(None)):
    raise HTTPException(status_code=501, detail="Not implemented: search_points")
