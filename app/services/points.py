from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from datetime import datetime, time as time_obj
from app.db.models import Point
from app.schemas.points import PointBase
from app.services.geocode import geocode_address


def _parse_time(s: Optional[str]) -> Optional[time_obj]:
    if s is None:
        return None
    return datetime.strptime(s, "%H:%M").time()


def create_point(db: Session, data: PointBase) -> Point:
    opens = _parse_time(data.opens_at)
    closes = _parse_time(data.closes_at)

    lat, lon = geocode_address(data.address)

    p = Point(
        name=data.name,
        address=data.address,
        waste_types=data.waste_types or [],
        opens_at=opens,
        closes_at=closes,
        latitude=lat,
        longitude=lon,
    )
    db.add(p)
    try:
        db.commit()
        db.refresh(p)
    except Exception:
        db.rollback()
        raise
    return p


def list_points(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    waste_type: Optional[str] = None,
    open_now: Optional[bool] = None,
) -> List[Point]:

    stmt = select(Point)
    filters = []
    if waste_type:
        filters.append(Point.waste_types.any(waste_type))
    if open_now:
        now = datetime.utcnow().time()
        filters.append(Point.opens_at <= now)
        filters.append(Point.closes_at >= now)

    if filters:
        stmt = stmt.where(and_(*filters))
    stmt = stmt.offset(skip).limit(limit)

    rows = db.execute(stmt).scalars().all()
    return rows


def get_point(db: Session, point_id: int) -> Optional[Point]:
    return db.get(Point, point_id)


def update_point(db: Session, point_id: int, data: PointBase) -> Optional[Point]:
    p = db.get(Point, point_id)
    if not p:
        return None

    updates = data.dict(exclude_unset=True)

    if "opens_at" in updates:
        p.opens_at = _parse_time(updates["opens_at"])
    if "closes_at" in updates:
        p.closes_at = _parse_time(updates["closes_at"])

    if "name" in updates:
        p.name = updates["name"]
    if "address" in updates:
        p.address = updates["address"]
        p.latitude, p.longitude = geocode_address(updates["address"])

    if "waste_types" in updates:
        p.waste_types = updates["waste_types"] or []

    db.add(p)
    try:
        db.commit()
        db.refresh(p)
    except Exception:
        db.rollback()
        raise

    return p


def delete_point(db: Session, point_id: int) -> bool:
    p: Optional[Point] = db.get(Point, point_id)
    if not p:
        return False
    try:
        db.delete(p)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True
