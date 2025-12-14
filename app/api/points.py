from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.schemas.points import PointBase
from app.services import points
from app.db.session import get_db

router = APIRouter()


@router.get("/")
async def list_points(
    db: Session = Depends(get_db),
    waste_type: Optional[str] = Query(None),
    open_now: Optional[bool] = Query(None),
    page: int = 1,
    size: int = 20,
):
    p = points.list_points(
        db, skip=(page - 1) * size, limit=size, waste_type=waste_type, open_now=open_now
    )
    return p


@router.get("/{point_id}")
async def get_point(point_id: int, db: Session = Depends(get_db)):
    p = points.get_point(db, point_id)
    if not p:
        raise HTTPException(status_code=404, detail="Point not found")
    return p


@router.post("/")
async def create_point(
    data: PointBase, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    return points.create_point(db, data)


@router.put("/{point_id}")
async def update_point(
    point_id: int,
    data: PointBase,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    p = points.update_point(db, point_id, data)
    if not p:
        raise HTTPException(status_code=404, detail="Point not found")
    return p


# @router.delete("/{point_id}")
async def delete_point(point_id: int, db: Session = Depends(get_db)):
    success = points.delete_point(db, point_id)
    if not success:
        raise HTTPException(status_code=404, detail="Point not found")
    return {"status": "deleted"}
