from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List

from app.schemas.points import PointBase
from app.services import points, storage
from app.db.session import get_db
from app.auth.deps import get_current_user, get_admin_user


router = APIRouter()


@router.get("/")
async def get_points(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None, description="Search by name or address"),
    waste_type: Optional[str] = Query(None, description="Filter by waste type"),
    open_now: Optional[bool] = Query(False, description="Filter points that are currently open"),
    skip: int = 0,
    limit: int = 50,
):
    p = points.list_points(
        db, skip=skip, limit=limit, q=q, waste_type=waste_type, open_now=open_now
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
    data: PointBase, db: Session = Depends(get_db), user=Depends(get_admin_user)
):
    return points.create_point(db, data)


@router.put("/{point_id}")
async def update_point(
    point_id: int,
    data: PointBase,
    db: Session = Depends(get_db),
    user=Depends(get_admin_user),
):
    p = points.update_point(db, point_id, data)
    if not p:
        raise HTTPException(status_code=404, detail="Point not found")
    return p


@router.delete("/{point_id}")
async def delete_point(point_id: int, db: Session = Depends(get_db), user=Depends(get_admin_user)):
    success = points.delete_point(db, point_id)
    if not success:
        raise HTTPException(status_code=404, detail="Point not found")
    return {"status": "deleted"}



@router.post("/{point_id}/photo")
async def upload_photo(point_id: int, file: UploadFile = File(...),
                       db: Session = Depends(get_db),
                       current_user = Depends(get_admin_user)):
    point = points.get_point(db, point_id)
    if not point:
        raise HTTPException(404, "Пункт не найден")

    content = await file.read()
    try:
        key = storage.upload_file(content, file.content_type)
    except ValueError as e:
        raise HTTPException(422, str(e))

    if point.photo_key:
        storage.delete_file(point.photo_key)

    point.photo_key = key
    db.commit()
    return {"photo_url": storage.get_presigned_url(key)}

@router.get("/{point_id}/photo")
def get_photo(point_id: int, db: Session = Depends(get_db)):
    point = points.get_point(db, point_id)
    if not point or not point.photo_key:
        raise HTTPException(404, "Фото не найдено")
    return {"photo_url": storage.get_presigned_url(point.photo_key)}

@router.delete("/{point_id}/photo")
def delete_photo(point_id: int, db: Session = Depends(get_db),
                 current_user = Depends(get_admin_user)):
    point = points.get_point(db, point_id)
    if not point or not point.photo_key:
        raise HTTPException(404, "Фото не найдено")
    storage.delete_file(point.photo_key)
    point.photo_key = None
    db.commit()
    return {"status": "deleted"}
