import os
import sys
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
TARGET_APPS = ["Microsoft Teams", "Google Chrome", "Teams"]

if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
    print("CRITICAL: TELEGRAM_TOKEN or TELEGRAM_CHAT_ID not found in .env file", file=sys.stderr)
    sys.exit(1)