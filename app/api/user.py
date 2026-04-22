from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserUpdate, UserRead
from app.services import user as user_service
from app.db.session import get_db
from app.auth.deps import require_same_user, get_current_user, get_admin_user, require_self_or_admin
from app.db.models import User, UserRole


router = APIRouter()

@router.get("/")
async def list_users(
    db: Session = Depends(get_db),
    _=Depends(get_admin_user),
):
    users = user_service.list_users(db)
    return users


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    u = user_service.get_user(db, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_self_or_admin),
):
    u = user_service.update_user(db, user_id, data)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_self_or_admin),
):
    success = user_service.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "deleted"}

@router.put("/{user_id}/role", response_model=UserRead)
def change_user_role(
    user_id: int,
    role: UserRole,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user
