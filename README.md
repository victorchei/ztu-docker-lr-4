# HelloDockerRealWorld

## Створення docker-compose.yml (Production)

Створіть файл `docker-compose.yml` у корені проекту з таким вмістом:

```yaml
version: '3' # Версія синтаксису Docker Compose
services:
  api: # Сервіс Node.js API
    build: ./api # Збірка образу з Dockerfile у папці api
    command: npm start # Команда запуску у production
    ports:
      - '3001:3001' # Проброс порту 3001 на хості у контейнер
    environment:
      - PORT=3001 # Змінна середовища для Node.js
      - HOST=localhost
      - MONGO_URL=mongodb://api_db:27017/api # URL для MongoDB
    depends_on:
      - api_db # Залежність: запускати після MongoDB
  api_db:
    image: mongo:latest # Офіційний образ MongoDB
    volumes:
      - mongodb_api:/data/db # Іменований том для збереження даних

volumes:
  mongodb_api: # Оголошення іменованого тому
```

## Створення docker-compose.dev.yml (Development)

Створіть файл `docker-compose.dev.yml` у корені проекту з таким вмістом:

```yaml
version: '3' # Версія синтаксису Docker Compose
services:
  api:
    build:
      context: ./api # Шлях до Dockerfile
      dockerfile: Dockerfile.dev # Використовуємо dev-образ
    command: npm run dev # Запуск з hot-reload
    ports:
      - '3001:3001' # Проброс порту
    environment:
      - PORT=3001
      - HOST=localhost
      - MONGO_URL=mongodb://api_db:27017/api
    volumes:
      - ./api/src:/usr/src/app/src # Том для синхронізації коду
    depends_on:
      - api_db
  api_db:
    image: mongo:latest
```

### Пояснення основних директив

- `version`: версія синтаксису Docker Compose.
- `services`: перелік сервісів (контейнерів), які запускаються разом.
- `build`: параметри для збірки Docker-образу.
- `command`: команда, яка виконується при старті контейнера.
- `ports`: проброс портів між хостом і контейнером.
- `environment`: змінні середовища для контейнера.
- `depends_on`: залежності між сервісами (який контейнер має стартувати першим).
- `volumes`: томи для збереження даних або синхронізації коду.

## Запуск проекту

- Для production: створіть `docker-compose.yml` за інструкцією вище та запустіть:
  ```sh
  docker compose up --build
  ```
- Для development: створіть обидва файли та запустіть:
  ```sh
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
  ```

---

_Файли docker-compose не зберігаються у git. Створюйте їх локально згідно інструкції._

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
