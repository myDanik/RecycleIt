from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.jwt_utils import decode_token
from app.db.session import get_db
from app.services.user import get_user
from app.schemas.user import UserBase
from app.db.models import UserRole



security = HTTPBearer()


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security), db=Depends(get_db)
):
    payload = decode_token(creds.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user_id = int(payload["sub"])
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_same_user(
    user_id: int,
    current_user: UserBase = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can access only your own profile",
        )
    return current_user

def get_admin_user(user=Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access forbidden")
    return user

def require_self_or_admin(
    user_id: int,
    user=Depends(get_current_user)
):
    if user.role != UserRole.admin and user.id != user_id:
        raise HTTPException(status_code=403, detail="Access forbidden")
    return user