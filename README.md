Markdown
# Notifications from Teams Bot

Асинхронный бот на Python для перехвата уведомлений Microsoft Teams (через Windows SDK) и проброса их в Telegram.

## Стек
* **Python 3.10+** (используется `winsdk` для взаимодействия с WinRT API)
* **Aiohttp** для асинхронных запросов к API Telegram
* **Colorlog** для красивого логирования в терминале

## Установка

1. Склонируй репозиторий:
   ```bash
   git clone [https://github.com/your_user/notifications-from-teams-bot.git](https://github.com/your_user/notifications-from-teams-bot.git)
   cd notifications-from-teams-bot
Создай и активируй виртуальное окружение:

```Bash
python -m venv venv
source venv/Scripts/activate 
```

Установи зависимости:

```Bash
pip install -r requirements.txt
```

Конфигурация
Создай файл .env в корне проекта и заполни его данными:

```Code snippet
TELEGRAM_BOT_TOKEN=ТВОЙ_ТОКЕН
TELEGRAM_CHAT_ID=YOUR_CHAT_ID
```
**Напиши своему боту чет и триггерни fetch_chat_id.py**

Запуск
```Bash
python main.py
```
Как это работает
При старте бот запрашивает доступ к уведомлениям Windows.

Кэширует текущие (старые) уведомления, чтобы не спамить при перезапуске.

Слушает только те приложения, которые указаны в config.py (по умолчанию: Teams, Chrome).

В случае непредвиденной ошибки в цикле (падение скрипта), бот отправляет "предсмертное" сообщение в Telegram с текстом ошибки.


---

**Что еще сделать?**
Если нужно, могу набросать `setup.py` или помочь с деплоем в автозагрузку Windows, чтобы бот стартовал сам при включении компа.