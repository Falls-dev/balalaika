# Balalaika <img src="https://i.redd.it/du9zy037wlxc1.png" width="32" /> - кеширующий прокси для медиа

Балалайка скачивает аудио и видео через `yt-dlp`, помещает вывод в локальный кеш и предоставляет API для постановки задач, просмотра состояния и удаления кеша. Сам сервис **не раздаёт файлы**: API запускается на `127.0.0.1`, а Nginx отдаёт каталог кеша по HTTP(S). Является форком [Floxy by monkestation](https://github.com/Monkestation/floxy).

## Быстрый запуск на Ubuntu + Nginx

Ниже предполагаются домен `example.com`, каталог `/opt/floxy` и пользователь службы `floxy` на сервере под Ubuntu 22 и выше. Замените их своими значениями.

1. Установите Node.js (версия указана в `.nvmrc`), pnpm, Nginx и FFmpeg. Убедитесь, что `ffmpeg` и `yt-dlp` доступны в `PATH` пользователя `floxy`.

```bash
sudo apt update
sudo apt install -y nginx ffmpeg
corepack enable
```

2. Установите `yt-dlp` следуя инструкциям по этой ссылке: https://github.com/yt-dlp/yt-dlp/wiki/Installation


3. Скопируйте проект в `/opt/floxy`, установите зависимости и соберите его.

   ```bash
   # Создаём пользователя floxy без пароля
   sudo useradd --system --home /opt/floxy --shell /usr/sbin/nologin floxy
   # Создаём папки и даём доступ юзеру floxy
   sudo mkdir -p /opt/floxy /etc/floxy
   sudo chown -R floxy:floxy /opt/floxy
   # Ставим зависимости
   cd /opt/floxy
   pnpm install --frozen-lockfile
   pnpm build
   ```

4. Создайте `/etc/floxy/floxy.env` с правами `600` и владельцем `root:floxy`:

   ```dotenv
   HOST=127.0.0.1
   PORT=3050
   JWT_SECRET=changeme123!
   DELETION_SECRET=changeme123!
   ADMIN_PASSWORD=changeme123!
   CACHE_FOLDER=/opt/floxy/cache
   LOGS_PATH=/opt/floxy/logs
   DATABASE_FILE=/opt/floxy/floxy.sqlite
   EXTERNAL_CACHE_ENDPOINTS=https://example.com/media
   ```

   Ключи можно сгенерировать командой `openssl rand -hex 32` или проехавшись лицом по клавиатуре. См. полный перечень переменных в [.env.example](.env.example).

5. Установите шаблоны развёртывания из `deploy/`, заменив `example.com` и пути при необходимости.

   ```bash
   sudo install -m 644 deploy/floxy.service /etc/systemd/system/floxy.service
   sudo install -m 644 deploy/nginx.conf /etc/nginx/sites-available/floxy
   sudo ln -s /etc/nginx/sites-available/floxy /etc/nginx/sites-enabled/floxy
   sudo nginx -t
   sudo systemctl daemon-reload
   sudo systemctl enable --now floxy nginx
   ```

6. Выпустите TLS-сертификат используя Certbot или используйте свой, после чего измените Nginx-конфигурацию на HTTPS. Не открывайте порт `3050`: наружу должны быть доступны только 80 и 443.

Проверьте API с сервера: `curl http://127.0.0.1:3050/api`. Статус служб: `systemctl status floxy nginx`; журналы: `journalctl -u floxy -f`.

## Безопасность

- `JWT_SECRET`, `DELETION_SECRET` и `ADMIN_PASSWORD` обязательны - используйте только надёжно сгенерированные ключи и пароль. Стандартные ключи и пароль будут отклонены.
- Кеш не должен иметь включённый `autoindex`, иначе будут видны идентификаторы и служебные файлы задач.
- CORS по умолчанию выключен. Если API будет вызываться через сайт то укажите его в `CORS_ORIGINS=https://app.example.com`.
- Файлы `cookies.txt`, `.env`, SQLite-база данных и каталог логов **не должны** быть видны через API.
- Параметр `EXTERNAL_CACHE_ENDPOINTS` должен совпадать с публичным URL `/media/`, иначе конечные клиенты получат неверные ссылки.

## Тестовая сборка

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Для продакшона используйте `pnpm build` и `pnpm start` ибо systemd шаблон запускает скомпилированный `dist/index.js` напрямую. Документация эндпоинтов в [API.md](API.md). Готовая коллекция запросов Bruno лежит в `bruno/`.

## Лицензия
У исходника нет лицензии так что думаю MIT наверное. Хрен его знает.
