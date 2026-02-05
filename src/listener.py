import sys
from winrt.windows.ui.notifications import NotificationKinds
from winrt.windows.ui.notifications.management import UserNotificationListener, UserNotificationListenerAccessStatus
from src.logger import app_logger


class WindowsNotificationListener:
    def __init__(self, target_app_name: str):
        self.target_app = target_app_name
        self.listener = self._get_listener_instance()
        self.processed_ids = set()

    def _get_listener_instance(self):
        try:
            if hasattr(UserNotificationListener, 'current'):
                return UserNotificationListener.current
            elif hasattr(UserNotificationListener, 'get_current'):
                return UserNotificationListener.get_current()
            else:
                # Если ничего не нашли, выводим отладку
                app_logger.critical(f"Available attributes: {dir(UserNotificationListener)}")
                raise AttributeError("Cannot find 'current' or 'get_current' in UserNotificationListener")
        except Exception as e:
            app_logger.critical(f"Failed to initialize listener: {e}")
            raise e

    async def request_access(self) -> bool:
        if not self.listener:
            return False

        try:
            status = await self.listener.request_access_async()
            if status == UserNotificationListenerAccessStatus.ALLOWED:
                app_logger.info("access to windows notifications granted")
                return True
            app_logger.critical("access to windows notifications denied")
            return False
        except Exception as e:
            app_logger.error(f"Error requesting access: {e}")
            return False

    async def get_new_notifications(self) -> list[str]:
        if not self.listener:
            return []

        messages = []
        try:
            notifications = await self.listener.get_notifications_async(NotificationKinds.TOAST)

            current_ids = {n.id for n in notifications}
            self.processed_ids = {pid for pid in self.processed_ids if pid in current_ids}

            for n in notifications:
                if n.id in self.processed_ids:
                    continue

                if not n.app_info or not n.app_info.display_info:
                    continue

                app_name = n.app_info.display_info.display_name

                if self.target_app.lower() in app_name.lower():
                    try:
                        bindings = n.notification.visual.bindings
                        if bindings and bindings.size > 0:
                            texts = [t.text for t in bindings.get_at(0).get_text_elements()]
                            full_text = " | ".join(texts)

                            app_logger.info(f"captured notification from {app_name}: {full_text}")
                            messages.append(full_text)
                    except Exception as e:
                        app_logger.warning(f"failed to parse text elements: {e}")

                    self.processed_ids.add(n.id)

        except Exception as e:
            app_logger.error(f"error reading notifications: {e}")

        return messages