import asyncio
import platform
import aiohttp
from winsdk.windows.ui.notifications.management import UserNotificationListener, UserNotificationListenerAccessStatus
from winsdk.windows.ui.notifications import NotificationKinds
from src.logger import app_logger
from src.config import TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, TARGET_APPS

log = app_logger()


async def send_telegram_crash_report(error_message):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": f"CRITICAL ERROR:\nBot has crashed unexpectedly.\n\nReason:\n{error_message}"
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    log.info("crash report sent to telegram")
                else:
                    log.error(f"failed to send crash report: {response.status}")
    except Exception as e:
        log.error(f"network error sending crash report: {e}")


async def get_listener():
    if platform.system() != "Windows":
        log.critical("application requires windows os")
        return None

    try:
        log.info("initializing winsdk notification bridge")
        listener = UserNotificationListener.current
        access_status = await listener.request_access_async()

        if access_status != UserNotificationListenerAccessStatus.ALLOWED:
            log.error("access to windows notifications denied")
            return None

        log.info("access to windows notifications granted")
        return listener
    except Exception as e:
        log.error(f"initialization error: {e}")
        return None


async def process_notifications(listener):
    log.info("caching existing notifications to skip history")
    known_ids = set()
    try:
        history = await listener.get_notifications_async(NotificationKinds.TOAST)
        for n in history:
            known_ids.add(n.id)
        log.info(f"skipped {len(known_ids)} old notifications")
    except Exception as e:
        log.warning(f"could not skip history: {e}")

    log.info("listening for target notifications loop started")

    while True:
        try:
            notifications = await listener.get_notifications_async(NotificationKinds.TOAST)
            current_ids = set()

            for n in notifications:
                current_ids.add(n.id)

                if n.id in known_ids:
                    continue

                app_name = n.app_info.display_info.display_name

                is_target = False
                for target in TARGET_APPS:
                    if target.lower() in app_name.lower():
                        is_target = True
                        break

                if not is_target:
                    continue

                try:
                    binding = n.notification.visual.get_binding("ToastGeneric")
                    if binding:
                        elements = binding.get_text_elements()
                        title = elements[0].text if len(elements) > 0 else ""
                        body = elements[1].text if len(elements) > 1 else ""

                        log.info(f"captured: [{app_name}] {title} - {body}")

                except Exception as inner_e:
                    log.warning(f"parse error: {inner_e}")

            known_ids = current_ids

        except Exception as e:
            log.error(f"error reading notifications: {e}")
            raise e

        await asyncio.sleep(2)


async def main():
    listener = await get_listener()
    if not listener:
        log.critical("shutting down")
        return

    try:
        await process_notifications(listener)
    except Exception as e:
        log.critical(f"bot crashed: {e}")
        await send_telegram_crash_report(str(e))
        raise e


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("application stopped by user")