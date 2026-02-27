from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.schemas.feedback import FeedbackCreate, FeedbackRead
from app.services import feedback as feedback_service
from app.db.session import get_db
from app.auth.deps import get_current_user
from app.services.feedback import create_feedback



router = APIRouter()


@router.post("/", response_model=FeedbackRead)
def post_feedback(
    data: FeedbackCreate, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    return create_feedback(db, data, user.id)


@router.get("/", response_model=List[FeedbackRead])
async def list_feedback(
    point_id: Optional[int] = Query(None), db: Session = Depends(get_db)
):
    fbs = feedback_service.list_feedbacks(db, point_id=point_id)
    return fbs


@router.get("/{feedback_id}", response_model=FeedbackRead)
async def get_feedback(
    feedback_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    fb = feedback_service.get_feedback(db, feedback_id)
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return fb


# @router.delete("/{feedback_id}")
async def delete_feedback(feedback_id: int, db: Session = Depends(get_db)):
    success = feedback_service.delete_feedback(db, feedback_id)
    if not success:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return {"status": "deleted"}
