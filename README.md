Markdown
# Notifications from Teams Bot

Асинхронный бот на Python для перехвата уведомлений Microsoft Teams (через Windows SDK) и проброса их в Telegram.

## Стек
* **Python 3.10+** (используется `winsdk` для взаимодействия с WinRT API)
* **Aiohttp** для асинхронных запросов к API Telegram
* **Colorlog** для красивого логирования в терминале

## Установка

Склонируй репозиторий:
```bash
   git clone https://github.com/Alexpro299999/notifications-from-teams-bot
   cd notifications-from-teams-bot
  ```
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
### Как узнать свой Chat ID?

Запиши токен **TELEGRAM_BOT_TOKEN** в .env.

Напиши любое сообщение своему боту в Telegram.

Запусти утилиту: 
```Bash
  python tools/fetch_chat_id.py
```

Запуск
```Bash
  python main.py
```
## Тестирование
Браузеры защищают поле "Источник" (Source) в уведомлениях, поэтому подделать его через new Notification невозможно — там всегда будет реальный домен сайта, с которого запущен код (например, bennish.net).

Чтобы проверить работу бота без реального звонка в Teams:

Откройте src/config.py.

Временно добавьте домен сайта, на котором будете тестировать, в список TEAMS_KEYWORDS.

Например, если тестируете на bennish.net:
```Python
TEAMS_KEYWORDS = [
    "teams.cloud.microsoft",
    "teams.microsoft.com",
    "bennish.net"  # ВРЕМЕННО
]
```
Запустите бота: python main.py.
Зайдите на:

**bennish.net/web-notifications.html** 

Нажмите Authorize.

Откройте консоль браузера (F12) и выполните код для вашего браузера.
#### Тест для Chrome (Footer Check)
```JavaScript
new Notification("любой тайтл", { body: "Тестовое сообщение в Chrome" });
```
#### Тест для Edge (Header Check)
```JavaScript
new Notification("teams.microsoft.com", { 
    body: "Проверка уведомления для Edge",
    requireInteraction: true 
});
```
Примечание: Бот настроен на поиск ключевых слов так что их можно добавить в **config.py**.
