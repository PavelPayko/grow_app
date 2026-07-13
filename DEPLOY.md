# Деплой (тестовая среда): PM2 + Nginx

Стек: статика React (`ui/dist`) через Nginx, API (Express) через PM2, PostgreSQL на том же сервере.

## 1. Подготовка сервера (Ubuntu 22.04+)

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql postgresql-contrib
sudo npm install -g pm2

# Пользователь приложения (опционально)
sudo useradd -m -s /bin/bash growapp
sudo mkdir -p /opt/grow_app
sudo chown growapp:growapp /opt/grow_app
```

## 2. PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE USER grow_app WITH PASSWORD 'your_secure_password';
CREATE DATABASE growdb OWNER grow_app;
SQL
```

## 3. Код приложения

```bash
cd /opt/grow_app
git clone <repo-url> .
# или: git pull для обновления
```

## 4. Переменные окружения API

```bash
cp api/.env.example api/.env
nano api/.env
```

Заполните `DB_PASSWORD`, `TOKEN_SECRET` (длинная случайная строка).

## 5. Инициализация БД (первый запуск)

```bash
cd /opt/grow_app/api
npm ci
npm run init
npm run seed
```

Создайте администратора: откройте в браузере `http://<server>/api/createAdmin`

## 6. Сборка и запуск

На слабом сервере **не собирайте UI на сервере** — Vite/TypeScript требуют много RAM и CPU. Соберите фронтенд на своём компьютере и загрузите готовый `ui/dist` (см. раздел «Обновление» ниже).

### Вариант A — слабый сервер (рекомендуется)

На **локальной машине** (нужен Node.js 20+):

```bash
cd grow_app
chmod +x deploy/publish.sh deploy/build-ui.sh
DEPLOY_HOST=growapp@<server-ip> ./deploy/publish.sh
```

Скрипт `publish.sh`:
- собирает `ui/dist` локально;
- заливает `ui/dist` на сервер через `rsync`;
- на сервере делает `git pull` и перезапускает API (`deploy.sh --skip-ui-build`).

Первый раз на сервере только API (без сборки UI):

```bash
cd /opt/grow_app
chmod +x deploy/deploy.sh
mkdir -p ui/dist
# затем с локальной машины: DEPLOY_HOST=... ./deploy/publish.sh
```

### Вариант B — мощный сервер

```bash
cd /opt/grow_app
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

Скрипт:
- ставит зависимости API (и UI, если без `--skip-ui-build`);
- собирает `ui/dist` (если не передан `--skip-ui-build`);
- перезапускает API через PM2

Автозапуск PM2 после перезагрузки сервера:

```bash
pm2 save
pm2 startup
# выполните команду, которую выведет pm2 startup
```

## 7. Nginx

```bash
sudo cp deploy/nginx/grow-app.conf /etc/nginx/sites-available/grow-app
sudo sed -i "s|GROW_APP_ROOT|/opt/grow_app|g" /etc/nginx/sites-available/grow-app
sudo sed -i "s|test.example.com|<ваш-домен-или-ip>|g" /etc/nginx/sites-available/grow-app
sudo ln -sf /etc/nginx/sites-available/grow-app /etc/nginx/sites-enabled/grow-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS (опционально):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d test.example.com
```

## 8. Обновление приложения

### Слабый сервер — с локальной машины

```bash
cd grow_app
DEPLOY_HOST=growapp@<server-ip> ./deploy/publish.sh
```

Переменные (опционально): `DEPLOY_PATH` (по умолчанию `/opt/grow_app`).

Только пересобрать UI без деплоя:

```bash
./deploy/build-ui.sh
rsync -avz --delete ui/dist/ growapp@<server-ip>:/opt/grow_app/ui/dist/
```

### Мощный сервер — всё на сервере

```bash
cd /opt/grow_app
git pull
./deploy/deploy.sh
sudo systemctl reload nginx   # обычно не нужен, если менялся только код
```

### Только API (фронт не менялся)

```bash
cd /opt/grow_app
git pull
./deploy/deploy.sh --skip-ui-build
```

## Локальная разработка

Поведение не изменилось: `npm run serve` в `api`, `npm run dev` в `ui`.
Vite проксирует `/api` → `http://localhost:3000`.

## Полезные команды

| Действие | Команда |
|----------|---------|
| Логи API | `pm2 logs grow-api` |
| Статус API | `pm2 status` |
| Перезапуск API | `pm2 restart grow-api` |
| Проверка Nginx | `sudo nginx -t` |

## Структура запросов

```
Браузер → Nginx :80
            /      → ui/dist (SPA)
            /api/* → localhost:3000 (PM2 / grow-api)
```

Фронтенд обращается к API по относительному пути `/api`, поэтому не нужно менять URL при смене домена.
