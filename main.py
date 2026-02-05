import asyncio
import platform
from src.config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TARGET_APPS
from src.listener import WindowsNotificationListener
from src.notifier import TelegramNotifier
from src.logger import app_logger


async def main():
    if platform.system() != "Windows":
        app_logger.critical("application requires windows os")
        return

    listener = WindowsNotificationListener(TARGET_APPS)
    if not await listener.request_access():
        return

    notifier = TelegramNotifier(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)

    app_logger.info("bot started. listening for notifications...")

    await listener.get_new_notifications()
    app_logger.info("history skipped")

    try:
        while True:
            messages = await listener.get_new_notifications()
            for msg in messages:
                await notifier.send_notification(msg)
            await asyncio.sleep(2)
    except Exception as e:
        app_logger.critical(f"bot crashed: {e}")
        await notifier.send_notification(f"critical error: bot crashed. reason: {e}")
        raise e
    finally:
        await notifier.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        app_logger.info("application stopped by user")