import asyncio
import sys
from aiogram import Bot
from aiogram.enums import ParseMode
from loguru import logger
from src.config import settings
from src.monitor import NotificationMonitor

logger.remove()
logger.add(sys.stderr, format="<green>{time:HH:mm:ss}</green> | <level>{message}</level>")


async def sender_loop(bot: Bot, monitor: NotificationMonitor):
    while True:
        await asyncio.sleep(settings.notification_delay)
        messages = await monitor.consume_buffer()

        if not messages:
            continue

        text = "\n\n".join(messages)
        final_msg = f"🔔 <b>Teams Notification</b>\n\n{text}"

        for user_id in settings.telegram_user_ids:
            try:
                await bot.send_message(
                    chat_id=user_id,
                    text=final_msg,
                    parse_mode=ParseMode.HTML
                )
            except Exception as e:
                logger.error(f"Failed to send to {user_id}: {e}")


async def main():
    monitor = NotificationMonitor()
    if not await monitor.request_access():
        logger.error("Access denied")
        return

    bot = Bot(token=settings.telegram_bot_token.get_secret_value())

    try:
        await asyncio.gather(
            monitor.start_polling(),
            sender_loop(bot, monitor)
        )
    finally:
        await bot.session.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass