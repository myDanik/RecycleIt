from fastapi import FastAPI
from . import health, points, feedback, auth, user, seo


def include_routers(app: FastAPI):
    app.include_router(health.router, prefix="", tags=["health"])
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(points.router, prefix="/points", tags=["points"])
    app.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
    app.include_router(user.router, prefix="/users", tags=["users"])
    app.include_router(seo.router, tags=["seo"])
    
