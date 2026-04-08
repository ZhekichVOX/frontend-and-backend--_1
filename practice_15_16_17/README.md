# Практики 15-16-17

## Что реализовано

- HTTPS-инструкции и App Shell архитектура (`index.html` + динамический `content/*`).
- WebSocket через Socket.IO (`newTask` -> `taskAdded`).
- Push API + Notification API:
  - подписка/отписка;
  - отправка push с сервера;
  - показ уведомления в `sw.js`.
- Офлайн-работа через Service Worker:
  - статика (`Cache First`);
  - контент (`Network First` с fallback).

## Подготовка

1. Установите зависимости:

```bash
npm install
```

2. Сгенерируйте VAPID-ключи:

```bash
npx web-push generate-vapid-keys
```

3. Подставьте ключи в:
- `server.js` (`publicKey`, `privateKey`)
- `app.js` (`vapidKey`)

4. Запуск:

```bash
npm start
```

Откройте `http://localhost:3001`.

## HTTPS (для практики 15)

В этой реализации сервер работает по HTTP для простого запуска. Для зачета пункта HTTPS используйте `mkcert` и запуск `http-server` с `--ssl`, как в методичке.
