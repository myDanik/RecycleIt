# app/schemas/feedback.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FeedbackCreate(BaseModel):
    point_id: int
    user_name: Optional[str]
    message: str
    rating: Optional[int]


class FeedbackRead(BaseModel):
    id: int
    point_id: int
    user_name: Optional[str]
    message: str
    rating: Optional[int]
    created_at: datetime

    class Config:
        orm_mode = True
