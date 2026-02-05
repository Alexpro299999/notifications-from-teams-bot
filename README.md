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
### Тестирование ()
Чтобы проверить работу бота без реального звонка в Teams, можно сгенерировать фейковое уведомление через браузер:

Для проверки работы фильтров (Edge/Chrome) открой консоль разработчика (F12) на сайте bennish.net/web-notifications.html.
Сначала нажми Authorize, затем используй команды ниже.
#### Google Chrome
Бот проверяет нижнюю часть уведомления (source/footer) или заголовок.
```JavaScript
new Notification("Microsoft Teams", { 
    body: "Проверка уведомления для Chrome",
    requireInteraction: true
});
```
#### Microsoft Edge
Бот проверяет верхнюю часть уведомления (header/source). В Edge источник часто указывается в заголовке.

```JavaScript
new Notification("teams.microsoft.com", { 
    body: "Проверка уведомления для Edge",
    requireInteraction: true 
});
```
Примечание: Бот настроен на поиск ключевых слов "Microsoft Teams" или "teams.microsoft.com". Уведомления с других сайтов без этих слов будут игнорироваться.
### Как это работает
При старте бот запрашивает доступ к уведомлениям Windows.

Кэширует текущие (старые) уведомления, чтобы не спамить при перезапуске.

Слушает только те приложения, которые указаны в config.py (по умолчанию: Teams, Chrome).

В случае непредвиденной ошибки в цикле (падение скрипта), бот отправляет "предсмертное" сообщение в Telegram с текстом ошибки.
