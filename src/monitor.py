import asyncio
from winsdk.windows.ui.notifications import NotificationKinds
from winsdk.windows.ui.notifications.management import UserNotificationListener, UserNotificationListenerAccessStatus
from loguru import logger
from src.config import settings


class NotificationMonitor:
    def __init__(self):
        self.listener = UserNotificationListener.current
        self._processed_ids = set()
        self._buffer = set()

    async def request_access(self) -> bool:
        status = await self.listener.request_access_async()
        return status == UserNotificationListenerAccessStatus.ALLOWED

    def _is_target_app(self, app_name: str) -> bool:
        return any(target.lower() in app_name.lower() for target in settings.target_apps)

    def _contains_keyword(self, text: str) -> bool:
        return any(key.lower() in text.lower() for key in settings.keywords)

    async def start_polling(self):
        logger.info("Monitor started")
        while True:
            try:
                notifs = await self.listener.get_notifications_async(NotificationKinds.TOAST)
                current_ids = {n.id for n in notifs}
                self._processed_ids.intersection_update(current_ids)

                for n in notifs:
                    if n.id in self._processed_ids:
                        continue

                    self._processed_ids.add(n.id)

                    try:
                        app_name = n.app_info.display_info.display_name

                        if not self._is_target_app(app_name):
                            continue

                        binding = n.notification.visual.get_binding("ToastGeneric")
                        if not binding:
                            continue

                        elements = binding.get_text_elements()
                        parts = [e.text for e in elements]

                        try:
                            if hasattr(binding, "attribution"):
                                attr = binding.attribution
                                if hasattr(attr, "text") and attr.text:
                                    parts.append(attr.text)
                        except Exception:
                            pass

                        full_text = " | ".join(parts)
                        logger.info(f"CAPTURED [{app_name}]: {full_text}")

                        if self._contains_keyword(full_text):
                            msg = f"<b>{app_name}</b>\n{full_text}"
                            self._buffer.add(msg)
                            logger.success(f"MATCHED: {full_text}")

                    except Exception as e:
                        logger.error(f"Error parsing ID {n.id}: {e}")

            except Exception as e:
                logger.error(f"Global loop error: {e}")
                await asyncio.sleep(5)

            await asyncio.sleep(1)

    async def consume_buffer(self) -> list[str]:
        if not self._buffer:
            return []
        data = list(self._buffer)
        self._buffer.clear()
        return data