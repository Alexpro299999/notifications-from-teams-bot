import httpx
from src.logger import app_logger


class TelegramNotifier:
    def __init__(self, token: str, chat_id: str):
        self.base_url = f"https://api.telegram.org/bot{token}/sendMessage"
        self.chat_id = chat_id
        self.client = httpx.AsyncClient(timeout=10.0)

    async def send_notification(self, message: str) -> None:
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "disable_notification": False
        }
        try:
            response = await self.client.post(self.base_url, json=payload)
            response.raise_for_status()
            app_logger.info("notification sent successfully")
        except httpx.HTTPError as e:
            app_logger.error(f"failed to send notification: {str(e)}")

    async def close(self):
        await self.client.aclose()
