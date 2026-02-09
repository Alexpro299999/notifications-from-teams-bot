from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    telegram_bot_token: SecretStr
    telegram_user_ids: list[int]
    notification_delay: int = 60
    target_apps: list[str] = ["Google Chrome", "Microsoft Edge"]
    keywords: list[str] = ["Teams"]


settings = Settings()
