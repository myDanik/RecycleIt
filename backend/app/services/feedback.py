from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import Feedback
from app.schemas.feedback import FeedbackCreate


def create_feedback(db: Session, data: FeedbackCreate, user_id: int) -> Feedback:
    fb = Feedback(
        point_id=data.point_id,
        user_id=user_id,
        message=data.message,
        rating=data.rating,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb


def list_feedbacks(db: Session, point_id: Optional[int] = None) -> List[Feedback]:
    query = db.query(Feedback)
    if point_id:
        query = query.filter(Feedback.point_id == point_id)
    return query.all()


def get_feedback(db: Session, feedback_id: int) -> Optional[Feedback]:
    return db.get(Feedback, feedback_id)


def delete_feedback(db: Session, feedback_id: int) -> bool:
    fb: Optional[Feedback] = db.get(Feedback, feedback_id)
    if not fb:
        return False
    db.delete(fb)
    db.commit()
    return True
