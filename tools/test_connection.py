import sys
import os
import asyncio
from src.config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
from src.logger import app_logger
from src.notifier import TelegramNotifier

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def test_send():
    app_logger.info("starting connection test")

    notifier = TelegramNotifier(
        token=TELEGRAM_BOT_TOKEN,
        chat_id=TELEGRAM_CHAT_ID
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