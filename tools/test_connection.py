import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config import load_dotenv
from src.logger import app_logger
from src.notifier import TelegramNotifier


async def test_send():
    app_logger.info("starting connection test")

    notifier = TelegramNotifier(
        token=load_dotenv.TELEGRAM_BOT_TOKEN,
        chat_id=load_dotenv.TELEGRAM_CHAT_ID
    )

    try:
        await notifier.send_notification("test message. system operational")
        app_logger.info("test message sent successfully")
    except Exception as e:
        app_logger.error(f"test failed: {e}")
    finally:
        await notifier.close()


if __name__ == "__main__":
    asyncio.run(test_send())
