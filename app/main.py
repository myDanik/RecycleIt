from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
from app.api.routers import include_routers
from app.config import settings
from app.db.session import engine, Base


_start_time = time.time()


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)
    app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)
    include_routers(app)


    @app.get("/")
    async def root():
        return {"message": "Recycling Points API. See /docs and /health"}

    app.state.start_time = _start_time
    return app


app = create_app()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
