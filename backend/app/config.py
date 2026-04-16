"""Runtime configuration via pydantic-settings (reads .env)."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


REPO_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # External APIs — all optional; synthetic fallback covers everything
    openweather_api_key: Optional[str] = None
    data_gov_in_api_key: Optional[str] = None
    cesium_ion_token: Optional[str] = None

    # Pipeline cadence
    tick_seconds: int = 7
    history_ticks: int = 2880  # 24h at 30s cadence upper bound

    # File paths
    stations_csv: Path = REPO_ROOT / "backend" / "app" / "data" / "delhi_stations.csv"
    artifacts_dir: Path = REPO_ROOT / "ml" / "artifacts"

    # CORS (loose for local dev)
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


_settings: Optional[Settings] = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
