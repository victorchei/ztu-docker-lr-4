# HelloDockerRealWorld — швидка інструкція

<!-- Badges -->

![Node.js](https://img.shields.io/badge/Node-18-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-4.3.9-lightgrey)
![Docker](https://img.shields.io/badge/Docker-%20-blue)
![Nginx](https://img.shields.io/badge/Nginx-alpine-green)

| Компонент | Мова / Фреймворк        | Основні бібліотеки / інструменти                                                 | Коротко                                                                             |
| --------- | ----------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| API       | Node.js / Express       | express, mongoose, dotenv, validator; mongodb-memory-server (dev), nodemon (dev) | Сервер у `api/src`, локальний запуск через `app.local.js` підтримує in-memory Mongo |
| Frontend  | React 18 / Vite         | react, react-dom, vite, @vitejs/plugin-react; `serve`/`npx serve` для проду      | Клієнт у `frontend/src`, Vite для dev, збірка у `frontend/build`                    |
| Nginx     | Nginx Alpine            | Reverse proxy                                                                    | Проксує запити до API та Frontend                                                   |
| DevOps    | Docker / Docker Compose | Dockerfile(.dev/.prod), docker-compose.yml, docker-compose.dev.yml               | Прод: nginx 80, Dev: nginx 8080                                                     |

README узагальнює поточні налаштування проекту: Dockerfile-и, docker-compose для продакшену та розробки, локальний запуск без Docker (включно з in-memory Mongo), а також `.env.local` для демонстрацій.

## Зміст

- [Структура проекту](#структура-проекту)
- [Опис гілок](#опис-гілок)
- [Архітектура з Nginx](#архітектура-з-nginx)
- [Запуск (Docker)](#запуск-docker)
- [Локальний запуск без Docker](#локальний-запуск-без-docker)
- [Прив'язка хоста](#прив'язка-хоста--localhost-або-00-00-00)
- [Перевірка hot-reload (development)](#перевірка-hot-reload-development)

## Структура проекту

<details>
<summary>Розгорнути / Згорнути — короткий огляд файлів (корисно для швидкого ознайомлення)</summary>

### Візуальне дерево (основні директорії)

```
├─ api/
│  ├─ Dockerfile(.dev)
│  ├─ package.json
│  └─ src/
│     ├─ app.js          # Express app
│     ├─ app.local.js    # Local dev entry (mongodb-memory-server)
│     ├─ configuration/  # конфіг (port, host, mongoURL)
│     ├─ routers/        # маршрути (users)
│     └─ models/         # Mongoose models (User)
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
│     ├─ main.jsx        # React entry
│     ├─ App.jsx         # головний компонент
│     └─ components/     # UserForm, UsersList
└─ nginx/
   ├─ Dockerfile
   └─ nginx.conf
```

### Таблиця файлів (коротко)

| Файл / Папка                            | Короткий опис                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `nginx/nginx.dev.conf`                  | Конфігурація Nginx для development (детальне логування, без кешування)                          |
| `nginx/nginx.prod.conf`                 | Конфігурація Nginx для production (оптимізації, gzip, rate limiting)                            |
| `nginx/Dockerfile.dev`                  | Dockerfile для Nginx development контейнера                                                     |
| `nginx/Dockerfile.prod`                 | Dockerfile для Nginx production контейнера з health check                                       |
| `nginx/Dockerfile`                      | Dockerfile для Nginx (за замовчуванням prod конфіг)                                             |
| `api/src/app.js`                        | Основний Express-додаток — підключає middleware та маршрути; стартує при підключенні до Mongo   |
| `api/src/app.local.js`                  | Локальний запуск: завантажує `.env.local` (якщо є) та піднімає in-memory Mongo для зручного dev |
| `api/src/routers/user.js`               | Маршрути `/users` (GET список, POST створення) + базова валідація помилок                       |
| `api/src/models/user.js`                | Mongoose-модель `User` з простими валідаторами (email через validator)                          |
| `api/.env.local`                        | Демонстраційні змінні оточення (локально)                                                       |
| `frontend/src/main.jsx`                 | Вхідний файл React (створює root і рендерить `App`)                                             |
| `frontend/src/App.jsx`                  | Головний компонент — об'єднує `UserForm` і `UsersList` і керує оновленням                       |
| `frontend/src/components/UserForm.jsx`  | Форма створення користувача; робить POST на API та відображає field-level помилки               |
| `frontend/src/components/UsersList.jsx` | Завантажує і відображає список користувачів з API                                               |
| `frontend/vite.config.js`               | Конфіг Vite (dev server, build)                                                                 |
| `frontend/package.json`                 | npm-скрипти: `start` (vite), `build`, `preview`                                                 |

</details>

## Опис гілок

- `main` — стабільна production-галузь: тут зберігаються релізи та готові до деплою зміни.
- `develop` — основна інтеграційна гілка для активної розробки та тестування перед злиттям в `main`.
- `frontend` — робота над клієнтською частиною (Vite / React). Ця гілка містить зміни інтерфейсу та фронтенд-логіки.
- `api` — робота над бекендом (папка `api`): зміни в маршрутах, моделях, конфігураціях сервера.

У цьому репозиторії використовуються такі механіки:

- `docker-compose.yml` — конфігурація для продакшен-стеку (production)
- `docker-compose.dev.yml` — доповнення для локальної розробки (dev)
- `api/.env.local` — демонстраційний локальний env (підхоплюється `app.local.js` через dotenv)
- `api/src/app.local.js` — файл, який при відсутності MONGO_URL запускає mongodb-memory-server (in-memory Mongo) і виводить URI у лог
- Dockerfile-и підтримують build-arg `NODE_IMAGE` (щоб легко перемикати образ Node при збірці)

---

## Архітектура з Nginx

Проект використовує Nginx як reverse proxy для маршрутизації запитів:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Nginx    │ :80 (prod) / :8080 (dev)
└──────┬──────┘
       │
       ├─► /api/*  ──► API Backend :3001
       │
       └─► /*      ──► Frontend :3000
```

**Переваги:**

- Єдина точка входу для всіх запитів
- Автоматична обробка CORS
- Легке масштабування та балансування навантаження
- Можливість додавання SSL/TLS сертифікатів

**Маршрутизація:**

- `http://localhost/` → Frontend (React app)
- `http://localhost/api/` → API Backend (Express)
- Development: `http://localhost:8080/`

---

## Основні відмінності Prod vs Dev

- Імена контейнерів тепер явні і містять суфікси `_prod` або `_dev` (щоб уникнути колізій):
  - prod: `nginx_prod`, `api_prod`, `frontend_prod`, `api_db_prod`
  - dev: `nginx_dev`, `api_dev`, `frontend_dev`, `api_db_dev`
- Порти на хості відрізняються між продом і девом:
  - Production (docker-compose.yml):
    - **nginx → host:80** (головна точка входу)
    - api → внутрішній :3001 (доступний тільки через nginx)
    - frontend → внутрішній :3000 (доступний тільки через nginx)
  - Development (docker-compose.dev.yml):
    - **nginx → host:8080** (головна точка входу)
    - api → внутрішній :3001
    - frontend → внутрішній :3000

**Важливо:** Тепер API та Frontend не мають прямого доступу з хост-машини. Весь трафік йде через Nginx.

---

## Запуск (Docker)

1. Production стек (prod):

```bash
docker compose up --build
# або
make prod
```

Відкрийте браузер: **http://localhost**

2. Development стек (dev) — окремо:

```bash
docker compose -f docker-compose.dev.yml up --build
# або
make dev
```

Відкрийте браузер: **http://localhost:8080**

3. Перегляд логів Nginx:

```bash
# Production
make logs-nginx

# Development
make logs-nginx-dev
```

---

## Локальний запуск без Docker (корисно для навчання)

В проекті є зручні npm-скрипти для запуску API локально, навіть якщо немає встановленого Mongo:

- `npm run dev:local` — development локально (nodemon) + mongodb-memory-server (якщо `MONGO_URL` не заданий). Файл запуску: `api/src/app.local.js`.
- `npm run prod:local` — production-like локальний запуск (NODE_ENV=production) теж через `app.local.js` і вмикає in-memory Mongo за потреби.

Після старту `app.local.js` буде логуватися рядок виду:

```
In-memory MongoDB started. Connection URI: mongodb://127.0.0.1:57098/...
```

Цей URI можна використовувати в `mongosh`, MongoDB Compass або DBeaver для перегляду бази під час сесії.

Щоб використати файл змінних оточення (наприклад, інший MONGO_URL), створіть `api/.env.local` або передайте `DOTENV_PATH=./.env.my` при запуску:

```bash
DOTENV_PATH=./.env.custom npm run dev:local
```

---

## Прив'язка хоста — `localhost` або `0.0.0.0`

Коротко: сервер можна запускати так, щоб він був доступний тільки з вашої машини (`localhost`), або доступний ззовні (всі інтерфейси) через адресу `0.0.0.0`.

- Локальний запуск (наприклад `node src/app.js`) за замовчуванням краще робити з `HOST=localhost` — тоді сервіс буде доступний тільки з вашої машини на `http://localhost:PORT`.
- У контейнерах Docker зазвичай використовують `HOST=0.0.0.0`. Це дозволяє Docker пробросити порт контейнера на хост і робити сервіс доступним ззовні (тобто `docker compose` може мапити порт контейнера на `localhost:3001` або інший порт вашої машини).

Технічна деталь: якщо в коді ви викликаєте `app.listen(port, host)`, то прив'язка буде відповідати переданому `host`. Якщо викликаєте `app.listen(port)` без `host`, Node зазвичай слухає на всіх інтерфейсах (еквівалентно `0.0.0.0`), але краще задавати `host` явно для уникнення плутанини в логах.

Файли `docker-compose.yml` у ваших прикладах можуть встановлювати `HOST=0.0.0.0` для контейнера — це нормально і необхідно для коректного порт-форвардингу.

---

## Перевірка hot-reload (development)

1. Запустіть development стек (див. вище) або локально `npm run dev:local`.
2. Змініть будь-який файл у `api/src` (наприклад `api/src/app.js` або `api/src/routers/user.js`).
3. У контейнері development використовується `nodemon`, який стежить за змінами у `src` (завдяки томові `./api/src:/usr/src/app/src`) і автоматично перезапустить процес Node.

Щоб побачити перезапуск у логах:

```bash
docker compose -f docker-compose.dev.yml logs -f api_dev
```

Або, якщо запускаєте локально без Docker:

```bash
npm run dev:local
# у іншому терміналі переглядайте логи виводу процесу (console.log з nodemon)
```

---

## Build-arg `NODE_IMAGE`

Dockerfile-и у проекті параметризовано через `ARG NODE_IMAGE`, а `docker-compose` передає `build.args.NODE_IMAGE`. Це дає змогу легко змінювати базовий образ Node (наприклад `node:22-bullseye-slim` або `node:22.14.0-bullseye-slim`) без редагування Dockerfile.

Приклад збірки з іншим образом:

```bash
docker compose build --build-arg NODE_IMAGE=node:22-bullseye-slim
```

Рекомендація: для local/CI використовувати `node:22-bullseye-slim` (сумісніший), а для production при бажанні можна обрати більш легкий alpine-образ — але пам'ятайте про сумісність нативних залежностей.

---

## Як створити локальні `docker-compose` файли (якщо вони не в репозиторії)

У цьому проєкті ми не комитимо `docker-compose` файли з конфіденційними або локальними налаштуваннями. Нижче — готові приклади, які ви можете скопіювати у свій локальний робочий каталог як `docker-compose.yml` (prod) та `docker-compose.dev.yml` (dev).

1. Створіть `docker-compose.yml` з таким вмістом (production):

```yaml
version: '3'
services:
  api:
    container_name: api_prod
    build:
      context: ./api
      args:
        NODE_IMAGE: node:22-bullseye-slim
    command: npm start
    ports:
      - '3001:3001'
    environment:
      - PORT=3001
      - HOST=0.0.0.0
      - MONGO_URL=mongodb://api_db:27017/api
    depends_on:
      - api_db

  frontend:
    container_name: frontend_prod
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        NODE_IMAGE: node:22-bullseye-slim
    command: serve -s build -l 3000
    ports:
      - '3000:3000'
    depends_on:
      - api

  api_db:
    container_name: api_db_prod
    image: mongo:latest
    volumes:
      - mongodb_api:/data/db

  nginx:
    container_name: nginx_prod
    image: nginx:alpine
    ports:
      - '80:80'
    depends_on:
      - api
      - frontend

volumes:
  mongodb_api:
```

2. Створіть `docker-compose.dev.yml` з цим вмістом (development):

```yaml
version: '3'
services:
  api:
    container_name: api_dev
    build:
      context: ./api
      dockerfile: Dockerfile.dev
      args:
        NODE_IMAGE: node:22-bullseye-slim
    command: npm run dev
    ports:
      - '3002:3001' # dev API доступний на хості 3002
    environment:
      - PORT=3001
      - HOST=0.0.0.0
      - MONGO_URL=mongodb://api_db:27017/api
    volumes:
      - ./api/src:/usr/src/app/src
    depends_on:
      - api_db

  frontend:
    container_name: frontend_dev
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
      args:
        NODE_IMAGE: node:22-bullseye-slim
    command: npm start
    ports:
      - '3003:3000' # dev frontend доступний на хості 3003
    environment:
      - VITE_API_BASE=${VITE_API_BASE:-http://localhost:3002}
    volumes:
      - ./frontend:/usr/src/app
      - /usr/src/app/node_modules
    stdin_open: true
    tty: true
    depends_on:
      - api

  api_db:
    container_name: api_db_dev
    image: mongo:latest
    volumes:
      - mongodb_api:/data/db

  nginx:
    container_name: nginx_dev
    image: nginx:alpine
    ports:
      - '8080:80'
    depends_on:
      - api
      - frontend

volumes:
  mongodb_api:
```

Пояснення і поради:

- `container_name` робить імена контейнерів предсказуваними (ми використовуємо `_prod` та `_dev` суфікси).
- У dev ми прив'язали інші хост-порти (3002/3003), щоб одночасно можна було піднімати prod і dev без колізій.
- `VITE_API_BASE` у dev за замовчуванням вказує на `host.docker.internal`, це дозволяє контейнеру фронтенду звертатись до API на хості (корисно для Docker Desktop/macOS). Можеш замінити на `http://localhost:3002` якщо у твоїй системі це працює.
- Якщо хочеш повну ізоляцію даних між prod і dev — змініть назви томів (`mongodb_api` → `mongodb_api_dev` для dev).

Зберігайте ці файли локально (не комить у публічний репозиторій), і потім запускайте відповідні команди з README.

---

## .env.local (демо) та безпека

В `api/` додано `api/.env.local` з демонстраційними значеннями (щоб студентам було просто стартувати). Також додано `api/ENV_LOCAL_README.md` з поясненням українською.

Увага:

- `.env.local` в цьому репозиторії — демонстраційний. Якщо ви працюєте з реальними ключами/секретами — не комітьте їх у публічні репозиторії.

---

## Перевірка API / приклади curl

**Через Nginx (рекомендовано):**

Production (порт 80):

```bash
curl -i -X POST http://localhost/api/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ivan","lastName":"Petrov","email":"ivan.petrov@example.com"}'
```

Development (порт 8080):

```bash
curl -i -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ivan","lastName":"Petrov","email":"ivan.petrov@example.com"}'
```

Отримати список користувачів:

```bash
curl -i http://localhost/api/users         # prod
curl -i http://localhost:8080/api/users   # dev
```

---

## Налаштування Nginx

Проект має окремі конфігурації Nginx для development та production:

### Development (`nginx.dev.conf`)

- **Детальне логування** (debug level)
- **Вимкнене кешування** для миттєвого відображення змін
- **Збільшені таймаути** (600s) для зручності debugging
- **CORS дозволений** для всіх origins
- **WebSocket підтримка** для Hot Module Replacement (HMR)

### Production (`nginx.prod.conf`)

- **Оптимізоване логування** (warn level)
- **Gzip compression** для зменшення розміру відповідей
- **Rate limiting** (10 req/s для API, 30 req/s для frontend)
- **Security headers** (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- **Connection pooling** (keepalive) для кращої продуктивності
- **Health check endpoint** (`/health`)

### Основні налаштування:

- Upstream для API: `api:3001`
- Upstream для Frontend: `frontend:3000`
- Проксі-заголовки для правильної роботи з IP та протоколом
- WebSocket підтримка через `Upgrade` заголовки

### Для зміни конфігурації:

**Development:**

1. Відредагуйте `nginx/nginx.dev.conf`
2. Перезавантажте: `make reload-nginx-dev`

**Production:**

1. Відредагуйте `nginx/nginx.prod.conf`
2. Перезберіть: `docker compose up --build nginx`
3. Або перезавантажте: `make reload-nginx`

---

## Деплой на Azure

### Крок 0: Підготовка Azure Container Registry (ACR)

#### Що таке Azure Container Registry?

ACR — це приватне сховище Docker образів у Azure. Переваги над Docker Hub:

- ✅ **Приватність** — тільки ви маєте доступ
- ✅ **Швидкість** — образи зберігаються в тому ж регіоні, що й ваші сервіси
- ✅ **Безпека** — інтеграція з Azure AD та Role-Based Access Control
- ✅ **Geo-replication** — можливість реплікації між регіонами

#### Встановлення Azure CLI

```bash
# macOS
brew install azure-cli

# Windows
# Скачайте з https://aka.ms/installazurecliwindows

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Перевірка версії
az --version
```

#### Авторизація в Azure

```bash
az login
# Відкриється браузер для входу в Microsoft account
```

#### Крок 1: Створення Resource Group та ACR

```bash
# 1. Створіть resource group (якщо ще не створено)
az group create \
  --name HelloDockerRG \
  --location westeurope

# 2. Створіть Azure Container Registry
# ВАЖЛИВО: ім'я має бути унікальним глобально (тільки літери та цифри)
az acr create \
  --resource-group HelloDockerRG \
  --name hellodockeracr \
  --sku Basic \
  --admin-enabled true

# 3. Отримайте інформацію про ACR
az acr show --name hellodockeracr --query loginServer --output tsv
# Результат: hellodockeracr.azurecr.io
```

**Примітка:** Замініть `hellodockeracr` на ваше унікальне ім'я!

#### Крок 2: Авторизація в ACR

```bash
# Спосіб 1: Через Azure CLI (рекомендовано)
az acr login --name hellodockeracr

# Спосіб 2: Отримати credentials вручну
az acr credential show --name hellodockeracr
# Скопіюйте username та password, потім:
docker login hellodockeracr.azurecr.io
```

#### Крок 3: Збірка та завантаження образів

```bash
# 1. Перейдіть до директорії проекту
cd /Users/viktorzhelizko/Projects-local/need\ to\ delete/ztu-docker-lr-4

# 2. Збудуйте образи з правильними тегами
docker build -t hellodockeracr.azurecr.io/api:latest ./api
docker build -t hellodockeracr.azurecr.io/frontend:latest ./frontend

# 3. Завантажте образи в ACR
docker push hellodockeracr.azurecr.io/api:latest
docker push hellodockeracr.azurecr.io/frontend:latest

# 4. Перевірте, що образи завантажені
az acr repository list --name hellodockeracr --output table
```

**Очікуваний результат:**

```
Result
----------
api
frontend
```

#### Крок 4: Перегляд образів в ACR

```bash
# Список всіх образів
az acr repository list --name hellodockeracr

# Список тегів для конкретного образу
az acr repository show-tags --name hellodockeracr --repository api

# Детальна інформація про образ
az acr repository show \
  --name hellodockeracr \
  --repository api
```

### Варіант 1: Деплой через Azure Container Apps (рекомендовано)

**Переваги:**

- Автоматичне масштабування (0 → N інстансів)
- Вбудований HTTPS
- Просте управління через CLI
- Підтримка мікросервісів

**Вартість:** ~$15-30/місяць (залежно від навантаження)

```bash
# 1. Створіть Container Apps environment
az containerapp env create \
  --name hellodocker-env \
  --resource-group HelloDockerRG \
  --location westeurope

# 2. Деплой MongoDB
az containerapp create \
  --name mongodb \
  --resource-group HelloDockerRG \
  --environment hellodocker-env \
  --image mongo:latest \
  --target-port 27017 \
  --ingress internal \
  --cpu 0.5 \
  --memory 1.0Gi

# 3. Деплой API з ACR
az containerapp create \
  --name api \
  --resource-group HelloDockerRG \
  --environment hellodocker-env \
  --image hellodockeracr.azurecr.io/api:latest \
  --registry-server hellodockeracr.azurecr.io \
  --registry-username $(az acr credential show --name hellodockeracr --query username -o tsv) \
  --registry-password $(az acr credential show --name hellodockeracr --query passwords[0].value -o tsv) \
  --target-port 3001 \
  --ingress internal \
  --env-vars \
    PORT=3001 \
    HOST=0.0.0.0 \
    MONGO_URL=mongodb://mongodb:27017/api \
  --cpu 0.5 \
  --memory 1.0Gi

# 4. Отримайте внутрішній URL API
API_URL=$(az containerapp show \
  --name api \
  --resource-group HelloDockerRG \
  --query properties.configuration.ingress.fqdn \
  -o tsv)

echo "API URL: https://$API_URL"

# 5. Деплой Frontend з ACR
az containerapp create \
  --name frontend \
  --resource-group HelloDockerRG \
  --environment hellodocker-env \
  --image hellodockeracr.azurecr.io/frontend:latest \
  --registry-server hellodockeracr.azurecr.io \
  --registry-username $(az acr credential show --name hellodockeracr --query username -o tsv) \
  --registry-password $(az acr credential show --name hellodockeracr --query passwords[0].value -o tsv) \
  --target-port 3000 \
  --ingress external \
  --env-vars \
    VITE_API_BASE=https://$API_URL/api \
  --cpu 0.25 \
  --memory 0.5Gi

# 6. Отримайте URL вашого додатку
az containerapp show \
  --name frontend \
  --resource-group HelloDockerRG \
  --query properties.configuration.ingress.fqdn \
  -o tsv
```

**Результат:** Ви отримаєте URL виду `https://frontend.kindgrass-12345678.westeurope.azurecontainerapps.io`

### Варіант 2: Деплой через Azure Container Instances (ACI)

**Переваги:**

- Найпростіший спосіб
- Платите тільки за час роботи
- Швидкий запуск

**Вартість:** ~$10-15/місяць

```bash
# 1. Отримайте credentials ACR
ACR_USERNAME=$(az acr credential show --name hellodockeracr --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name hellodockeracr --query passwords[0].value -o tsv)

# 2. Створіть контейнер MongoDB
az container create \
  --resource-group HelloDockerRG \
  --name mongodb \
  --image mongo:latest \
  --ports 27017 \
  --cpu 1 \
  --memory 1

# 3. Створіть контейнер API
az container create \
  --resource-group HelloDockerRG \
  --name api \
  --image hellodockeracr.azurecr.io/api:latest \
  --registry-login-server hellodockeracr.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --ports 3001 \
  --cpu 1 \
  --memory 1 \
  --environment-variables \
    PORT=3001 \
    HOST=0.0.0.0 \
    MONGO_URL=mongodb://mongodb:27017/api

# 4. Отримайте IP API
API_IP=$(az container show \
  --resource-group HelloDockerRG \
  --name api \
  --query ipAddress.ip \
  -o tsv)

# 5. Створіть контейнер Frontend
az container create \
  --resource-group HelloDockerRG \
  --name frontend \
  --image hellodockeracr.azurecr.io/frontend:latest \
  --registry-login-server hellodockeracr.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label hellodocker-frontend \
  --ports 3000 \
  --cpu 0.5 \
  --memory 0.5 \
  --environment-variables \
    VITE_API_BASE=http://$API_IP:3001/api
```

### Оновлення образів (CI/CD)

Коли ви змінили код і хочете оновити деплой:

```bash
# 1. Збудуйте нові образи
docker build -t hellodockeracr.azurecr.io/api:latest ./api
docker build -t hellodockeracr.azurecr.io/frontend:latest ./frontend

# 2. Завантажте в ACR
docker push hellodockeracr.azurecr.io/api:latest
docker push hellodockeracr.azurecr.io/frontend:latest

# 3. Оновіть Container Apps
az containerapp update \
  --name api \
  --resource-group HelloDockerRG \
  --image hellodockeracr.azurecr.io/api:latest

az containerapp update \
  --name frontend \
  --resource-group HelloDockerRG \
  --image hellodockeracr.azurecr.io/frontend:latest

# Або для ACI (потрібно перестворити контейнер)
az container delete --resource-group HelloDockerRG --name api --yes
az container create ... # повторіть команду створення
```

### Моніторинг та логи

```bash
# Перегляд статусу всіх Container Apps
az containerapp list --resource-group HelloDockerRG -o table

# Логи API
az containerapp logs show \
  --name api \
  --resource-group HelloDockerRG \
  --follow

# Логи Frontend
az containerapp logs show \
  --name frontend \
  --resource-group HelloDockerRG \
  --follow

# Для ACI
az container logs \
  --resource-group HelloDockerRG \
  --name api \
  --follow
```

### Масштабування

```bash
# Container Apps - автоматичне масштабування
az containerapp update \
  --name api \
  --resource-group HelloDockerRG \
  --min-replicas 1 \
  --max-replicas 5

# ACI - зміна ресурсів
az container update \
  --resource-group HelloDockerRG \
  --name api \
  --cpu 2 \
  --memory 2
```

### Додавання власного домену та SSL

```bash
# 1. Додайте власний домен
az containerapp hostname add \
  --name frontend \
  --resource-group HelloDockerRG \
  --hostname www.yourdomain.com

# 2. SSL сертифікат додається автоматично через Let's Encrypt
```

### Видалення ресурсів

```bash
# Видалити все (включно з ACR та всіма образами)
az group delete --name HelloDockerRG --yes --no-wait

# Видалити тільки Container Apps (залишити ACR)
az containerapp delete --name api --resource-group HelloDockerRG --yes
az containerapp delete --name frontend --resource-group HelloDockerRG --yes
az containerapp delete --name mongodb --resource-group HelloDockerRG --yes
az containerapp env delete --name hellodocker-env --resource-group HelloDockerRG --yes
```

### Production best practices

1. **Використовуйте Azure Cosmos DB** замість контейнера MongoDB:

```bash
az cosmosdb create \
  --name hellodocker-cosmos \
  --resource-group HelloDockerRG \
  --kind MongoDB \
  --server-version 4.2
```

2. **Налаштуйте CI/CD** через GitHub Actions або Azure DevOps

3. **Додайте Application Insights** для моніторингу:

```bash
az monitor app-insights component create \
  --app hellodocker-insights \
  --location westeurope \
  --resource-group HelloDockerRG
```

4. **Використовуйте Azure Key Vault** для секретів:

```bash
az keyvault create \
  --name hellodocker-vault \
  --resource-group HelloDockerRG \
  --location westeurope
```

### Вартість (приблизно)

| Сервіс               | Ціна          | Примітка                  |
| -------------------- | ------------- | ------------------------- |
| ACR Basic            | $5/місяць     | 10 GB storage             |
| Container Apps       | $15-30/місяць | Залежить від навантаження |
| ACI                  | $10-20/місяць | Платите за CPU/RAM hour   |
| Cosmos DB            | $24+/місяць   | Production база даних     |
| Application Insights | $2-10/місяць  | Моніторинг                |

**Безкоштовні альтернативи для студентів:**

- [Azure for Students](https://azure.microsoft.com/en-us/free/students/) — $100 кредитів
- [GitHub Student Developer Pack](https://education.github.com/pack) — безкоштовний доступ до багатьох сервісів

### 🎓 Для студентів: GitHub Student Developer Pack

Якщо ви студент, ви можете отримати **безкоштовний доступ** до Azure та багатьох інших сервісів!

#### Крок 1: Активація GitHub Student Developer Pack

1. **Перейдіть на**: https://education.github.com/pack
2. **Натисніть "Get student benefits"**
3. **Підтвердіть студентський статус:**
   - Завантажте студентський квиток або
   - Використайте університетську email (@edu домен)
4. **Дочекайтесь підтвердження** (зазвичай 1-3 дні)

#### Крок 2: Активація Azure for Students

**Після отримання Student Developer Pack:**

```bash
# 1. Перейдіть на сторінку Azure for Students
# https://azure.microsoft.com/en-us/free/students/

# 2. Натисніть "Activate now"

# 3. Увійдіть з Microsoft account або створіть новий

# 4. Підтвердіть студентський статус через GitHub
```

**Що ви отримаєте:**

✅ **$100 кредитів Azure** (на 12 місяців)  
✅ **Безкоштовні сервіси** без кредитної картки:

- Azure App Service
- Azure Container Instances (750 годин/місяць)
- Azure Database for PostgreSQL/MySQL
- Azure DevOps

✅ **Після закінчення кредитів:**

- Можете перейти на Pay-As-You-Go
- Або використовувати тільки безкоштовні сервіси

#### Крок 3: Оптимізований деплой для студентів

**Варіант А: Використання безкоштовних 750 годин ACI**

```bash
# 1. Створіть resource group
az group create \
  --name HelloDockerStudentRG \
  --location westeurope

# 2. Без ACR (використовуємо Docker Hub для економії)
# Збудуйте та завантажте образи в Docker Hub
docker build -t YOUR_DOCKERHUB_USERNAME/hellodocker-api:latest ./api
docker build -t YOUR_DOCKERHUB_USERNAME/hellodocker-frontend:latest ./frontend

docker login
docker push YOUR_DOCKERHUB_USERNAME/hellodocker-api:latest
docker push YOUR_DOCKERHUB_USERNAME/hellodocker-frontend:latest

# 3. Деплой через ACI (безкоштовні 750 годин/місяць)
az container create \
  --resource-group HelloDockerStudentRG \
  --name hellodocker-api \
  --image YOUR_DOCKERHUB_USERNAME/hellodocker-api:latest \
  --ports 3001 \
  --cpu 0.5 \
  --memory 0.5 \
  --environment-variables \
    PORT=3001 \
    HOST=0.0.0.0 \
    MONGO_URL=mongodb+srv://... # використайте MongoDB Atlas Free Tier

az container create \
  --resource-group HelloDockerStudentRG \
  --name hellodocker-frontend \
  --image YOUR_DOCKERHUB_USERNAME/hellodocker-frontend:latest \
  --dns-name-label hellodocker-student-YOURNAME \
  --ports 3000 \
  --cpu 0.25 \
  --memory 0.5 \
  --environment-variables \
    VITE_API_BASE=http://API_IP:3001/api
```

**Вартість:** ~$0/місяць (в межах безкоштовних лімітів)

**Варіант Б: Використання кредитів ($100)**

```bash
# З ACR та Container Apps (краща якість)
# Використовуйте інструкції з основного розділу деплою

# Моніторинг витрат кредитів:
az consumption usage list \
  --start-date 2024-01-01 \
  --end-date 2024-12-31
```

#### Крок 4: Альтернативні безкоштовні сервіси для студентів

**MongoDB - MongoDB Atlas (безкоштовний tier):**

1. Зареєструйтесь: https://www.mongodb.com/cloud/atlas/register
2. Створіть безкоштовний кластер M0 (512 MB)
3. Отримайте Connection String
4. Використайте в змінній `MONGO_URL`

```bash
# Приклад Connection String
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mydb?retryWrites=true&w=majority
```

**Альтернативи Azure Container Registry:**

- **Docker Hub Free**: 1 приватний репозиторій
- **GitHub Container Registry**: безкоштовний для публічних репозиторіїв
- **Quay.io**: безкоштовний public registry

**Моніторинг та логи:**

- **Datadog**: безкоштовно для студентів через GitHub Pack
- **Sentry**: безкоштовний tier для error tracking

#### Крок 5: Економія ресурсів

**Автоматичне вимкнення в неробочий час:**

```bash
# Створіть скрипт для зупинки контейнерів
# stop-containers.sh

#!/bin/bash
az container stop --resource-group HelloDockerStudentRG --name hellodocker-api
az container stop --resource-group HelloDockerStudentRG --name hellodocker-frontend

# Запуск знову
# start-containers.sh

#!/bin/bash
az container start --resource-group HelloDockerStudentRG --name hellodocker-api
az container start --resource-group HelloDockerStudentRG --name hellodocker-frontend
```

**Налаштуйте через Azure Automation або GitHub Actions:**

```yaml
# .github/workflows/azure-schedule.yml
name: Stop Azure Containers (Night)

on:
  schedule:
    - cron: '0 22 * * *' # 22:00 UTC щодня

jobs:
  stop:
    runs-on: ubuntu-latest
    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Stop Containers
        run: |
          az container stop --resource-group HelloDockerStudentRG --name hellodocker-api
          az container stop --resource-group HelloDockerStudentRG --name hellodocker-frontend
```

#### Корисні посилання для студентів

📚 **Навчальні ресурси:**

- [Microsoft Learn for Students](https://docs.microsoft.com/en-us/learn/student-hub/)
- [Azure Fundamentals](https://docs.microsoft.com/en-us/learn/paths/azure-fundamentals/)
- [GitHub Campus Experts](https://education.github.com/experts)

🎁 **Інші безкоштовні сервіси з GitHub Student Pack:**

- **Heroku**: $13/місяць кредитів
- **DigitalOcean**: $200 кредитів
- **Namecheap**: безкоштовний домен .me на 1 рік
- **JetBrains**: професійні IDE безкоштовно
- **Stripe**: звільнення від комісії на перші $1000

💡 **Поради:**

1. **Відстежуйте витрати**:

```bash
# Перевірка залишку кредитів
az account show --query "subscriptionPolicies"
```

2. **Використовуйте тільки необхідні ресурси**:

   - Мінімальні CPU/Memory для dev
   - Вимикайте на ніч
   - Видаляйте невикористані ресурси

3. **Налаштуйте бюджет**:

```bash
az consumption budget create \
  --budget-name student-budget \
  --amount 50 \
  --time-grain Monthly \
  --start-date 2024-01-01 \
  --end-date 2024-12-31 \
  --resource-group HelloDockerStudentRG
```

#### Порівняння варіантів для студентів

| Варіант                    | Вартість | Складність  | Рекомендовано для  |
| -------------------------- | -------- | ----------- | ------------------ |
| Docker Hub + ACI           | $0       | Низька      | Демо, навчання     |
| ACR + ACI + $100 кредитів  | ~$0-20   | Середня     | Курсові проекти    |
| Container Apps + Cosmos DB | ~$30-50  | Висока      | Production проекти |
| Heroku (з Student Pack)    | $0-13    | Дуже низька | Швидкий старт      |

### Troubleshooting

**Помилка: "registry access denied"**

```bash
# Перезавантажте ACR credentials
az acr login --name hellodockeracr
```

**Помилка: "name already exists"**

```bash
# Виберіть інше унікальне ім'я для ACR
az acr create --name hellodocker$(date +%s) ...
```

**Container не запускається**

```bash
# Перевірте логи
az containerapp logs show --name api --resource-group HelloDockerRG --tail 100
```
