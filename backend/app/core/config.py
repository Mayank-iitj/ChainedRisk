import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    CR_ENV: str = "dev"
    CR_SECRET_KEY: str = "chainedrisk-super-secret-key-change-in-prod"
    CR_APPROVAL_HMAC_KEY: str = "chainedrisk-approval-hmac-key-min-32-chars-long!"
    CR_DB_URL: str = "sqlite:///./data/chainedrisk.db"
    CR_GRAPH_BACKEND: str = "networkx"
    CR_LLM_ENABLED: bool = True
    ANTHROPIC_API_KEY: str = ""
    CR_LLM_MODEL: str = "claude-3-7-sonnet"
    CR_APPROVAL_TTL_SECONDS: int = 600
    CR_REQUIRE_SEPARATE_APPROVER: bool = False
    CR_LAB_NETWORK: str = "chained_lab"
    CR_LAB_CIDR: str = "10.77.0.0/24"
    CR_RUNNER_IMAGE: str = "chainedrisk/runner:1.0"
    CR_MAX_UPLOAD_MB: int = 200

    # Discord optional integration
    DISCORD_BOT_TOKEN: str = ""
    DISCORD_APP_ID: str = ""
    DISCORD_PUBLIC_KEY: str = ""
    DISCORD_CHANNEL_ID: str = ""
    CR_APPROVER_DISCORD_IDS: str = ""

    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()

# Ensure data directory exists for sqlite
data_dir = Path("./data")
data_dir.mkdir(parents=True, exist_ok=True)

