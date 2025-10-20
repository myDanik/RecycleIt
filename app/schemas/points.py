from pydantic import BaseModel
from typing import Optional, List

class PointBase(BaseModel):
    id: int
    name: str
    address: Optional[str]
    waste_types: Optional[List[str]]
    opens_at: Optional[str]
    closes_at: Optional[str]