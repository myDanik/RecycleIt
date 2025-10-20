from fastapi import FastAPI
from app.api.routers import include_routers
from app.config import settings
import time


_start_time = time.time()


def create_app() -> FastAPI:
    app = FastAPI(title="Recycling Points API", version=settings.APP_VERSION)
    include_routers(app)

    @app.get("/")
    async def root():
        return {"message": "Recycling Points API. See /docs and /health"}

    app.state.start_time = _start_time
    return app


app = create_app()