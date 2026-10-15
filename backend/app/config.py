from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = Field(default="Smart Recycling Assistant")
    app_env: str = Field(default="development")
    database_path: str = Field(default="./smart_recycling.db")
    upload_dir: str = Field(default="./uploads")
    cors_origins: str = Field(default="http://localhost:3000")
    openai_api_key: str = Field(default="")
    openai_model: str = Field(default="gpt-4o-mini")
    model_path: str = Field(default="")
    demo_mode: bool = Field(default=False)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def database_file(self) -> Path:
        path = Path(self.database_path)
        if not path.is_absolute():
            path = PROJECT_ROOT / path
        return path.resolve()

    @property
    def uploads_folder(self) -> Path:
        path = Path(self.upload_dir)
        if not path.is_absolute():
            path = PROJECT_ROOT / path
        return path.resolve()

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
