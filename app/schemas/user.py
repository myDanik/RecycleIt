from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserRead(BaseModel):
    id: int
    username: str
    email: str


class UserBase(BaseModel):
    id: int
    username: str
    email: str
    password_hash: str


class UserUpdate(BaseModel):
    username: str
    email: str
    password: str
