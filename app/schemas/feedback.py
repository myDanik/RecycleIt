from pydantic import BaseModel
from typing import Optional

class FeedbackCreate(BaseModel):
    point_id: int
    user_name: Optional[str] = None
    message: str
    rating: Optional[int] = None


