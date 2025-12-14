from fastapi import FastAPI
from . import health, points, feedback, auth


def include_routers(app: FastAPI):
    app.include_router(health.router, prefix="", tags=["health"])
    app.include_router(points.router, prefix="/points", tags=["points"])
    app.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
