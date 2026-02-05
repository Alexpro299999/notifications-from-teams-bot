from winsdk.windows.ui.notifications.management import UserNotificationListener, UserNotificationListenerAccessStatus
from winsdk.windows.ui.notifications import NotificationKinds
from src.logger import app_logger
from src.config import TEAMS_KEYWORDS


def _is_valid_source(app_name: str, texts: list[str]) -> bool:
    if not texts:
        return False

    app_name_lower = app_name.lower()

    if "edge" in app_name_lower:
        header_source = texts[0]
        if any(k.lower() in header_source.lower() for k in TEAMS_KEYWORDS):
            return True
        return False

    if "chrome" in app_name_lower:
        footer_source = texts[-1]
        if any(k.lower() in footer_source.lower() for k in TEAMS_KEYWORDS):
            return True
        return False

    return False


class WindowsNotificationListener:
    def __init__(self, target_apps: list[str]):
        self.target_apps = target_apps
        self.listener = UserNotificationListener.current
        self.processed_ids = set()

    async def request_access(self) -> bool:
        try:
            status = await self.listener.request_access_async()
            if status == UserNotificationListenerAccessStatus.ALLOWED:
                app_logger.info("access to windows notifications granted")
                return True
            app_logger.critical("access to windows notifications denied")
            return False
        except Exception as e:
            app_logger.error(f"error requesting access: {e}")
            return False

    async def get_new_notifications(self) -> list[str]:
        messages = []
        try:
            notifications = await self.listener.get_notifications_async(NotificationKinds.TOAST)
            current_ids = {n.id for n in notifications}
            self.processed_ids = {pid for pid in self.processed_ids if pid in current_ids}

            for n in notifications:
                if n.id in self.processed_ids:
                    continue

                app_name = n.app_info.display_info.display_name

                is_target = False
                for t in self.target_apps:
                    if t.lower() in app_name.lower():
                        is_target = True
                        break

                if not is_target:
                    continue

                try:
                    binding = n.notification.visual.get_binding("ToastGeneric")
                    if binding:
                        elements = binding.get_text_elements()
                        texts = [e.text for e in elements]

                        if not _is_valid_source(app_name, texts):
                            self.processed_ids.add(n.id)
                            continue

                        full_text = " | ".join(texts)
                        app_logger.info(f"captured: [{app_name}] {full_text}")
                        messages.append(f"{app_name}: {full_text}")
                except Exception as e:
                    app_logger.warning(f"parse error: {e}")

                self.processed_ids.add(n.id)

        except Exception as e:
            app_logger.error(f"error reading notifications: {e}")

        return messages