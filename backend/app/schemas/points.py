from pydantic import BaseModel
from typing import Optional, List


class PointBase(BaseModel):
    name: str
    address: Optional[str]
    waste_types: Optional[List[str]]
    opens_at: Optional[str]
    closes_at: Optional[str]


class PointRead(PointBase):
    id: int
    latitude: Optional[float]
    longitude: Optional[float]

class PointUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    waste_types: Optional[List[str]] = None
    opens_at: Optional[str] = None
    closes_at: Optional[str] = None