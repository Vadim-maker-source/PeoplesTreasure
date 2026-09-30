# Сокровища народов — Flutter

Мобильный клиент для основного проекта PeoplesTreasure. Использует мобильный API `/api/mobile/v1` и общую PostgreSQL-базу сайта.

## Возможности

- вход и регистрация по email с защищённым хранением токенов;
- вход через Яндекс ID в Android-приложении;
- автоматическое обновление access-токена и ротация refresh-токена;
- отдельный форум с поиском, сортировкой, лайками и комментариями;
- создание публикаций и загрузка фотографий;
- каталог народов, подробные материалы, тесты и прогресс;
- обращения в поддержку и ответы команды;
- мобильная модерация публикаций и поддержки для роли `ADMIN`;
- адаптивная навигация для телефона, планшета и web.

## Запуск

По умолчанию приложение подключается к production API:

```powershell
http://94.232.42.94:3456/api/mobile/v1
```

Обычный запуск:

```powershell
flutter run
```

Для Android LoginSDK добавьте Client ID приложения Яндекса в
`android/local.properties`:

```properties
YANDEX_CLIENT_ID=идентификатор_приложения
```

Для локальной разработки сначала запустите сайт на порту 3001, а затем
переопределите API при запуске приложения. Для Android Emulator:

```powershell
npm run dev -- -p 3001
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001/api/mobile/v1
```

Для физического устройства укажите IP компьютера в локальной сети:

```powershell
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3001/api/mobile/v1
```

Для публикации мобильной release-сборки сначала подключите домен и HTTPS, затем передайте защищённый адрес через `API_BASE_URL`.
До подключения HTTPS Android и iOS разрешают незашифрованные запросы только к
текущему IP `94.232.42.94`.

## Проверки

```powershell
flutter analyze
flutter test
flutter build web --release --dart-define=API_BASE_URL=http://localhost:3001/api/mobile/v1
```

Готовый debug APK находится в `build/app/outputs/flutter-apk/app-debug.apk`.
