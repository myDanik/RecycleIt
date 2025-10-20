from fastapi import APIRouter, Request
from datetime import datetime
import time


router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    start_time = getattr(request.app.state, "start_time", time.time())
    uptime_seconds = int(time.time() - start_time)
    return {"status": "ok", "uptime_seconds": uptime_seconds, "timestamp": datetime.utcnow().isoformat()}