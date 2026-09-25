# Сокровища народов — Flutter

Мобильный клиент для основного проекта PeoplesTreasure. Использует мобильный API `/api/mobile/v1` и общую PostgreSQL-базу сайта.

## Возможности

- вход и регистрация по email с защищённым хранением токенов;
- автоматическое обновление access-токена и ротация refresh-токена;
- лента, поиск, сортировка, лайки и комментарии;
- создание публикаций и загрузка фотографий;
- каталог народов, подробные материалы, тесты и прогресс;
- обращения в поддержку и ответы команды;
- мобильная модерация публикаций и поддержки для роли `ADMIN`;
- адаптивная навигация для телефона, планшета и web.

## Запуск

Сначала запустите сайт из соседней папки на порту 3001:

```powershell
npm run dev -- -p 3001
```

Android Emulator автоматически использует `10.0.2.2`:

```powershell
flutter run
```

Для физического устройства укажите IP компьютера в локальной сети:

```powershell
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3001/api/mobile/v1
```

Для production передавайте HTTPS-адрес API:

```powershell
flutter build apk --release --dart-define=API_BASE_URL=https://example.com/api/mobile/v1
```

## Проверки

```powershell
flutter analyze
flutter test
flutter build web --release --dart-define=API_BASE_URL=http://localhost:3001/api/mobile/v1
```

Готовый debug APK находится в `build/app/outputs/flutter-apk/app-debug.apk`.
