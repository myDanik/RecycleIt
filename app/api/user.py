from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserUpdate
from app.services import user as user_service
from app.db.session import get_db
from app.deps import require_same_user

router = APIRouter()


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_same_user),
):
    u = user_service.get_user(db, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_same_user),
):
    u = user_service.update_user(db, user_id, data)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_same_user),
):
    success = user_service.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "deleted"}
