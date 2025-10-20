from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Recycling Points API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000


settings = Settings()