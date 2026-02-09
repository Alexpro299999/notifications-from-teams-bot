import asyncio
from aiohttp import web
from aiogram import Bot
from aiogram.enums import ParseMode
from loguru import logger
from src.config import settings

bot = Bot(token=settings.telegram_bot_token.get_secret_value())


async def handle_notification(request):
    try:
        data = await request.json()
        domain = data.get("domain", "unknown")
        title = data.get("title", "")
        body = data.get("body", "")

        full_text = f"{title} | {body}"
        logger.info(f"INCOMING [{domain}]: {full_text}")

        if not any(k in domain for k in settings.keywords) and not any(k in domain for k in ["bennish", "teams"]):
            return web.Response(text="Skipped domain")

        msg = f"🔔 <b>Teams ({domain})</b>\n{full_text}"

        for user_id in settings.telegram_user_ids:
            try:
                await bot.send_message(chat_id=user_id, text=msg, parse_mode=ParseMode.HTML)
            except Exception as e:
                logger.error(f"Telegram error: {e}")

        return web.Response(text="OK")
    except Exception as e:
        logger.error(f"Server error: {e}")
        return web.Response(status=500)


async def main():
    app = web.Application()
    app.router.add_post('/notify', handle_notification)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 12345)

    logger.success("Python Server running on http://localhost:12345")

    try:
        await site.start()
        while True:
            await asyncio.sleep(3600)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())