from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError


from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, Token, UserRead, RefreshRequest
from app.services.user import authenticate_user, create_user
from app.auth.jwt_utils import create_access_token, create_refresh_token, decode_token

router = APIRouter()


@router.post("/register", response_model=UserRead)
def register(data: UserCreate, db: Session = Depends(get_db)):
    try:
        return create_user(db, data)
    except IntegrityError:
        raise HTTPException(status_code=422, detail="User already exists")


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.username, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": create_access_token(user.id, user.role),
        "refresh_token": create_refresh_token(user.id, user.role),
        "token_type": "bearer",
        "role": user.role,
        "id": user.id,
        "username": user.username,
    }

@router.post("/refresh")
def refresh_token(data: RefreshRequest):
    payload = decode_token(data.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = int(payload["sub"])
    role = payload["role"]
    return {
        "access_token": create_access_token(user_id, role),
    }