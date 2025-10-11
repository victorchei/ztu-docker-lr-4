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

Запуск режимів окремо

- Запустити тільки production-стек (без dev):

```sh
docker compose up --build
```

- Запустити тільки development-стек (без production):

```sh
docker compose -f docker-compose.dev.yml up --build
```

- Запустити обидва одночасно (production + development) — команда нижче підніме обидва набори сервісів. Важливо, що dev використовує інші імена сервісів і інший том для БД, тому вони не конфліктуватимуть по іменах:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

_Файли docker-compose не зберігаються у git. Створюйте їх локально згідно інструкції._

## Прив'язка хоста — `localhost` або `0.0.0.0`

Коротко: сервер можна запускати так, щоб він був доступний тільки з вашої машини (`localhost`), або доступний ззовні (всі інтерфейси) через адресу `0.0.0.0`.

- Локальний запуск (наприклад `node src/app.js`) за замовчуванням краще робити з `HOST=localhost` — тоді сервіс буде доступний тільки з вашої машини на `http://localhost:PORT`.
- У контейнерах Docker зазвичай використовують `HOST=0.0.0.0`. Це дозволяє Docker пробросити порт контейнера на хост і робити сервіс доступним ззовні (тобто `docker compose` може мапити порт контейнера на `localhost:3001` або інший порт вашої машини).

Рекомендація:

- Для розробки локально використовуйте `localhost` (безпечніше та простіше для демонстрацій).
- Для запуску в контейнері або коли потрібно, щоб сервіс був доступний зовні (інша машина/гостьова мережа), виставляйте `HOST=0.0.0.0` (в Dockerfile або у `docker-compose.yml`).

Технічна деталь: якщо в коді ви викликаєте `app.listen(port, host)`, то прив'язка буде відповідати переданому `host`. Якщо викликаєте `app.listen(port)` без `host`, Node зазвичай слухає на всіх інтерфейсах (еквівалентно `0.0.0.0`), але краще задавати `host` явно для уникнення плутанини в логах.

Файли `docker-compose.yml` у ваших прикладах можуть встановлювати `HOST=0.0.0.0` для контейнера — це нормально і необхідно для коректного порт-форвардингу.

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

Як тестувати автоматичне оновлення (hot-reload)

- Переконайтесь, що ви підняли development-сервіс (`api_dev`) за допомогою `docker compose -f docker-compose.dev.yml up --build` або в комбінації з production.
- В контейнері development використовується `nodemon`, який стежить за змінами у `src` (завдяки томові `./api/src:/usr/src/app/src`).
- Змініть файл, наприклад `api/src/routers/user.js` або `api/src/app.js`, на вашій машині (локально) — Docker синхронізує зміни у контейнер, і `nodemon` автоматично перезапустить Node процес.
- Приклади змін для перевірки:

  - Змініть текст логування у `api/src/app.js` (наприклад текст у console.log в `startServer()`), збережіть файл — ви повинні побачити новий текст у логах контейнера.
  - Змініть обробку відповіді у `api/src/routers/user.js` (наприклад статус або текст помилки), виконайте curl-запит і перевірте нову поведінку.

- Перевірка логів контейнера (щоб побачити перезапуск):

```sh
docker compose -f docker-compose.dev.yml logs -f api_dev
```

## Перевірка збереження даних у БД

- У production-режимі дані MongoDB зберігаються у томі `mongodb_api` і не втрачаються при видаленні контейнера.
- У development-режимі можна протестувати збереження даних аналогічно.

---

## Перевірка API — готові скрипти і приклади curl

Після того, як контейнери запущено (production або development), ви можете перевірити роботу API за допомогою готового скрипта або ручних curl-запитів.

- Готовий скрипт знаходиться у `api/test_requests.sh`. Щоб запустити (з кореня проєкту):

```sh
./api/test_requests.sh
```

- Скрипт виводить приклади створення користувача (успішний і з помилкою валідації) і список користувачів. Скрипт використовує `jq` для форматованого виводу JSON. Якщо `jq` не встановлено, встановіть його (наприклад, `brew install jq` на macOS) або запустіть ручні curl-команди нижче без `| jq .`.

- Ручні приклади `curl` (еквівалентно скрипту):
- Ручні приклади `curl` (еквівалентно скрипту). Якщо ви підняли production-стек — використовуйте порт 3001; якщо підняли development-стек паралельно — development доступний на порті 3002.

Створити користувача (успішно, production на 3001):

```sh
curl -i -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ivan","lastName":"Petrov","email":"ivan.petrov@example.com"}'
```

Створити користувача (успішно, development на 3002):

```sh
curl -i -X POST http://localhost:3002/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ivan","lastName":"Petrov","email":"ivan.petrov@example.com"}'
```

Створити користувача (невалідний email, production):

```sh
curl -i -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Invalid","lastName":"Email","email":"not-an-email"}'
```

Отримати список всіх користувачів (production):

```sh
curl -i http://localhost:3001/users
```

Отримати список всіх користувачів (development):

```sh
curl -i http://localhost:3002/users
```

Порада: ключ `-i` показує заголовки відповіді (включаючи HTTP статус). Це корисно при демонстрації різних кодів стану (200, 400 тощо).

---

_Для додаткових питань звертайтесь до інструктора або перегляньте документацію Docker._

## Makefile — швидкий запуск

Щоб спростити запуск стеків під час демонстрацій, у корені проєкту доданий `Makefile` з кількома корисними цілями.

Навіщо Makefile?

- Забирає потребу запам'ятовувати довгі команди docker compose під час заняття.
- Дає швидкий інтерфейс: `make dev`, `make prod`, `make both`, `make down`.

Як користуватись:

```sh
make prod      # запустити production стек у фоні (detached)
make dev       # запустити тільки development стек у фоні
make both      # запустити обидва одночасно
make down      # зупинити всі сервіси (docker compose down)
make logs-dev  # дивитися логи development API
make logs-prod # дивитися логи production API
```

Це просто обгортки над командами `docker compose` і зручно під час демонстрацій або лабораторних занять.
