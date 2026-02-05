import sys
import os
import asyncio
import httpx
from dotenv import load_dotenv
from src.logger import app_logger

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()


async def get_chat_id():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        app_logger.critical("telegram_bot_token not found in env file")
        return

    url = f"https://api.telegram.org/bot{token}/getUpdates"
    app_logger.info("attempting to fetch updates from telegram")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            if not data["result"]:
                app_logger.warning("no messages found. please send a message to the bot first")
                return

            last_msg = data["result"][-1]
            chat_id = last_msg["message"]["chat"]["id"]
            username = last_msg["message"]["chat"].get("username", "unknown")

            app_logger.info(f"success. username: {username}")
            app_logger.info(f"your chat id is: {chat_id}")
            app_logger.info("please update telegram_chat_id in your .env file")

        except Exception as e:
            app_logger.error(f"failed to fetch updates: {e}")


if __name__ == "__main__":
    asyncio.run(get_chat_id())
