from fastapi import APIRouter, HTTPException
from app.schemas.feedback import FeedbackCreate


router = APIRouter()


@router.post("/")
async def post_feedback(feedback: FeedbackCreate):
    raise HTTPException(status_code=501, detail="Not implemented: post_feedback")