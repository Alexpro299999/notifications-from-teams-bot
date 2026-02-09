import asyncio
from winsdk.windows.ui.notifications import NotificationKinds
from winsdk.windows.ui.notifications.management import UserNotificationListener, UserNotificationListenerAccessStatus
from aiogram import Bot
from loguru import logger
from src.config import settings


class NotificationService:
    def __init__(self, bot: Bot):
        self.bot = bot
        self.listener = UserNotificationListener.current
        self._processed_ids = set()

    async def request_access(self) -> bool:
        status = await self.listener.request_access_async()
        return status == UserNotificationListenerAccessStatus.ALLOWED

    async def start(self):
        logger.info("Service started")
        while True:
            try:
                notifications = await self.listener.get_notifications_async(NotificationKinds.TOAST)
                current_ids = {n.id for n in notifications}

                for n in notifications:
                    if n.id not in self._processed_ids:
                        self._processed_ids.add(n.id)
                        asyncio.create_task(self._handle_notification(n.id))

                self._processed_ids = {pid for pid in self._processed_ids if pid in current_ids}

            except Exception as e:
                logger.error(f"Loop error: {e}")

            await asyncio.sleep(2)

    async def _handle_notification(self, notification_id: int):
        await asyncio.sleep(settings.notification_delay)

        current_notifs = await self.listener.get_notifications_async(NotificationKinds.TOAST)
        target_notification = next((n for n in current_notifs if n.id == notification_id), None)

        if not target_notification:
            logger.info(f"ID {notification_id} handled by user. Skipping.")
            return

        text_content = self._parse_content(target_notification)
        if text_content:
            await self._send_telegram(text_content)

    def _parse_content(self, notification) -> str | None:
        try:
            app_name = notification.app_info.display_info.display_name

            if not any(t.lower() in app_name.lower() for t in settings.target_apps):
                return None

            binding = notification.notification.visual.get_binding("ToastGeneric")
            if not binding:
                return None

            elements = binding.get_text_elements()
            full_text = " | ".join([e.text for e in elements])

            if not any(k.lower() in full_text.lower() for k in settings.keywords):
                return None

            return f"<b>{app_name}</b>\n{full_text}"
        except Exception:
            return None

    async def _send_telegram(self, text: str):
        for user_id in settings.telegram_user_ids:
            try:
                await self.bot.send_message(
                    chat_id=user_id,
                    text=f"⚠️ <b>Missed Notification</b>\n\n{text}",
                    parse_mode="HTML"
                )
            except Exception as e:
                logger.error(f"Send error: {e}")