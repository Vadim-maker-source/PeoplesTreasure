# Сокровища народов

Монорепозиторий содержит веб-приложение на Next.js, API для мобильного клиента и Flutter-приложение в каталоге `mobile`.

## Локальный запуск веб-приложения

```bash
npm ci
npx prisma migrate deploy
npm run dev
```

По умолчанию Next.js доступен на `http://localhost:3000`.

## Docker, PostgreSQL и Nginx

Создайте закрытый файл окружения из шаблона и замените секреты:

```bash
cp .env.docker.example .env.docker
```

Для `NEXTAUTH_SECRET` используйте случайную строку длиной не менее 32 символов. Укажите публичный адрес сайта в `NEXTAUTH_URL` и `NEXT_PUBLIC_BASE_URL`.

Запуск production-стека:

```bash
docker compose --env-file .env.docker up -d --build
```

Compose запускает PostgreSQL, применяет Prisma-миграции, поднимает standalone-сборку Next.js и публикует её через Nginx на порту `HTTP_PORT` (по умолчанию `80`). База данных наружу не публикуется.

Проверка состояния:

```bash
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f migrate app nginx
```

Остановка без удаления данных:

```bash
docker compose --env-file .env.docker down
```

Для HTTPS нужен домен: после привязки DNS добавьте сертификат в Nginx или поставьте внешний TLS-прокси. HSTS намеренно не отправляется через обычный HTTP.

## Flutter

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001/api/mobile/v1
```

Для физического Android-устройства с `adb reverse tcp:3001 tcp:3001` используйте `http://127.0.0.1:3001/api/mobile/v1`. Для production-сборки передайте публичный HTTPS-адрес API.
