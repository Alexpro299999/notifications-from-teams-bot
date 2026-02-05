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
### Тестирование через Chrome
Чтобы проверить работу бота без реального звонка в Teams, можно сгенерировать фейковое уведомление через браузер:

Открой сайт bennish.net/web-notifications.html.

Нажми кнопку **Authorize**, чтобы разрешить уведомления.

Открой консоль разработчика (нажми F12 и перейди во вкладку Console).

Вставь следующий код и нажми Enter:

```JavaScript
new Notification("Microsoft Teams", { body: "Тестовое уведомление для проверки бота" });
```
Бот перехватит это уведомление, так как заголовок совпадает с фильтром (Microsoft Teams), и перешлет его в Telegram.

### Как это работает
При старте бот запрашивает доступ к уведомлениям Windows.

Кэширует текущие (старые) уведомления, чтобы не спамить при перезапуске.

Слушает только те приложения, которые указаны в config.py (по умолчанию: Teams, Chrome).

В случае непредвиденной ошибки в цикле (падение скрипта), бот отправляет "предсмертное" сообщение в Telegram с текстом ошибки.
