# HelloDockerRealWorld

## Запуск у режимі продакшену (Production)

1. Переконайтесь, що у вас встановлено Docker.
2. Запустіть команду:
   ```sh
   docker compose up --build
   ```
3. Контейнери будуть запущені згідно налаштувань з `docker-compose.yml`.
   - Сервер API запускається командою `npm start` (використовується `api/Dockerfile`).
   - MongoDB використовує іменований том `mongodb_api` для постійного зберігання даних.

## Запуск у режимі розробки (Development)

1. Переконайтесь, що у вас встановлено Docker.
2. Запустіть команду:
   ```sh
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```
3. Контейнери будуть запущені з додатковими налаштуваннями з `docker-compose.dev.yml`:
   - Сервер API запускається командою `npm run dev` (hot-reload через nodemon, використовується `api/Dockerfile.dev`).
   - Всі зміни у коді (папка `api/src`) автоматично потрапляють у контейнер і перезапускають сервер.
   - MongoDB може використовувати іменований том (якщо додано у dev-конфігурації).

## Важливі файли

- `docker-compose.yml` — основна конфігурація для production.
- `docker-compose.dev.yml` — додаткова конфігурація для development.
- `api/Dockerfile` — Dockerfile для production (мінімальний образ, тільки необхідні залежності).
- `api/Dockerfile.dev` — Dockerfile для development (з nodemon, dev-залежностями, hot-reload).
- `api/package.json` — скрипти запуску та залежності.

## Перевірка hot-reload

1. Запустіть у режимі розробки.
2. Змініть будь-який файл у `api/src`.
3. Сервер автоматично перезапуститься у контейнері.

## Перевірка збереження даних у БД

- У production-режимі дані MongoDB зберігаються у томі `mongodb_api` і не втрачаються при видаленні контейнера.
- У development-режимі можна протестувати збереження даних аналогічно.

---

_Для додаткових питань звертайтесь до інструктора або перегляньте документацію Docker._
