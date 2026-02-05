import os
import sys
from dotenv import load_dotenv
from src.logger import app_logger

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

TARGET_APPS = [
    "Google Chrome",
    "Microsoft Edge"
]

TEAMS_KEYWORDS = [
    "teams.cloud.microsoft",
    "teams.microsoft.com",
    "Microsoft Teams",
    "Teams"
]

if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
    app_logger.critical("telegram_bot_token or telegram_chat_id not found in .env file")
    sys.exit(1)