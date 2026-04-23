from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from datetime import datetime
import bcrypt

from app.db.models import User
from app.schemas.user import UserCreate, UserUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(password: str) -> str:
    password = password[:72].encode("utf-8")
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())
    return hashed.decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    password_bytes = password[:72].encode("utf-8")
    hashed_bytes = hashed.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=_hash_password(payload.password),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        role="admin",
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
    return user

def list_users(db: Session) -> List[User]:
    return db.query(User).all()


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def update_user(db: Session, user_id: int, payload: UserUpdate) -> Optional[User]:
    user: Optional[User] = db.get(User, user_id)
    if not user:
        return None

    updates = payload.dict(exclude_unset=True)
    if "username" in updates:
        user.username = updates["username"]
    if "email" in updates:
        user.email = updates["email"]
    if "password" in updates and updates["password"]:
        user.password_hash = _hash_password(updates["password"])

    user.updated_at = datetime.utcnow()
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
    return user


def delete_user(db: Session, user_id: int) -> bool:
    user: Optional[User] = db.get(User, user_id)
    if not user:
        return False
    try:
        db.delete(user)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not _verify_password(password, user.password_hash):
        return None
    return user