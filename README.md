# ☁️ MyCloud — Облачное хранилище (SaaS)

**mycloud-django-react**

Полнофункциональное облачное хранилище с real-time синхронизацией, защищённым доступом и автоматизированным деплоем со 100% покрытием тестами.

[![CI Pipeline](https://github.com/Safmaxser/mycloud-django-react/actions/workflows/ci.yml/badge.svg)](https://github.com/Safmaxser/mycloud-django-react/actions/workflows/ci.yml)
![Version](https://img.shields.io/github/v/tag/Safmaxser/mycloud-django-react?style=for-the-adge&label=version&color=orange)
<br>

![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node](https://img.shields.io/badge/Node-22-339933?style=for-the-badge&logo=node.js&logoColor=white)<br>
![Docker](https://img.shields.io/badge/Docker-29.2-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-5.1-2496ED?style=for-the-badge&logo=docker&logoColor=white)

<br>

## ✨ Основной функционал

Проект реализует полный цикл управления пользовательским контентом в облачной среде:

- **📂 Управление файлами и метаданными:**

  Загрузка, скачивание и удаление контента. Поддержка редактирования имен и комментариев как через модальное окно предпросмотра, так и напрямую в интерактивной таблице (Inline Editing) для оперативного управления. А также управление публичным доступом (генерация внешних ссылок)

- **👥 Панель администратора (User & Storage Management):**

  Централизованный интерфейс для управления пользователями и их хранилищами.
  - **Управление аккаунтами:** Изменение личных данных (Username, Full Name, Email), назначение прав администратора и безвозвратное удаление профилей.
  - **Контроль контента:** Полный доступ к чужим хранилищам — просмотр, редактирование метаданных, удаление файлов и генерация публичных ссылок.

- **🛡️ Безопасность и разграничение прав:**

  В проекте реализована комплексная защита данных на всех уровнях:
  - **Изоляция данных:** Каждому пользователю выделено индивидуальное хранилище. Доступ к чужим файлам строго ограничен на уровне Django Permissions (исключение — администраторы).
  - **Защита сессий:** Безопасная передача данных через HTTPS (TLS) с использованием механизмов Secure Cookies и CSRF-защиты для предотвращения атак типа Session Hijacking.
  - **Многоуровневая защита управления (Foolproof):**
    - **Self-Action Protection:** Администратор не может удалить себя или снять с себя права доступа через интерфейс системы.
    - **Resource Control:** Блокировка загрузки файлов в чужие хранилища администратором для предотвращения нецелевого расхода квот.
    - **API Enforcement:** Все бизнес-правила (запрет смены ролей обычным юзером и т.д.) дублируются на уровне бэкенда.

- **⚡ Real-time синхронизация:**

  Мгновенное обновление всех сегментов интерфейса (списки файлов, статус квот, метаданные) при любых изменениях в хранилище через защищённый протокол WebSockets (WSS). Реализовано на базе Django Channels и Redis, что исключает необходимость ручного обновления страницы.

- **📊 Конфигурируемое квотирование ресурсов:**

  Централизованное управление лимитами дискового пространства и максимальным размером файлов через переменные окружения (.env). Система обеспечивает строгую валидацию на уровне сериализаторов Django, гарантируя соблюдение установленных ограничений для всех пользователей.

- **📱 Адаптивность (Cross-device):**

  Полная поддержка мобильных устройств и планшетов. Интерфейс автоматически оптимизируется под любые разрешения и ориентации экрана (Portrait/Landscape).

- **🌐 Публичный доступ и обмен:**

  Генерация уникальных защищённых ссылок для обмена файлами с внешними пользователями. Система позволяет открывать и закрывать доступ в один клик, сохраняя при этом полный контроль владельца над файлом в его приватном хранилище.

<br>

## 🚀 Технологический стек

- **Backend:**
  - Python 3.13, Django 6.0, DRF, PostgreSQL.
  - Channels (WebSockets), Redis (Caching & Pub/Sub).
  - Пакетный менеджер: **uv** (high-performance package manager).

- **Frontend:**
  - React 19 (SPA), Vite 7, TypeScript, React Router.
  - State Management: **Redux Toolkit 2.0 (Slice Creators)**.
  - Styling: **Tailwind CSS 4.0**, Иконки: **Lucide React**, Пакетный менеджер: **Yarn**.

- **Infrastructure & DevOps:**
  - Docker & Docker Compose (Orchestration).
  - Nginx (X-Accel-Redirect), Traefik (Edge Router & Auto-SSL).
  - CI/CD: **GitHub Actions** (Automated Testing & SSH Deployment).

<br>

## 📚 Документация внешних инструментов

Ниже приведены ссылки на официальную документацию ключевых инструментов, расширяющих базовый функционал используемых фреймворков:

- **[uv](https://docs.astral.sh/uv/)** — высокопроизводительный менеджер пакетов для Python. Используется для управления зависимостями и ускорения сборки Docker-образов.
- **[Traefik Proxy](https://doc.traefik.io/traefik/)** — современный реверс-прокси. В проекте отвечает за автоматический выпуск SSL-сертификатов (Let's Encrypt).
- **[Redis](https://redis-docs.ru/)** — хранилище данных в памяти. Используется как брокер сообщений для *Django Channels*.
- **[Django Channels](https://channels.readthedocs.io)** — расширение Django для работы с асинхронными протоколами (WebSockets).
- **[Tailwind CSS](https://tailwindcss.com)** — Utility-first CSS фреймворк для стилизации интерфейса.
- **[React Hot Toast](https://react-hot-toast.com)** — библиотека для реализации всплывающих уведомлений (Toasts) в SPA-приложении.
- **[Lucide React](https://lucide.dev)** — современный и производительный набор иконок в формате SVG. Используется для обеспечения визуального единообразия интерфейса.

<br>

## 🛠️ Архитектура и Инфраструктура

Проект построен на принципах **Infrastructure as Code (IaC)** и микросервисной архитектуры:

1. **Контейнеризация (Docker):** Система изолирована в 5 микросервисов (`traefik`, `db`, `redis`, `backend`, `frontend`), развёрнутых через Docker Compose.
2. **Reverse Proxy (Traefik):** Выступает в роли Edge Router, обеспечивая автоматическую генерацию SSL-сертификатов Let's Encrypt и безопасную маршрутизацию трафика.
3. **Безопасность (Security):**
   - Бэкенд скрыт внутри Docker-сети и недоступен извне напрямую.
   - Реализованы защищённые сессии (Secure Cookies) и строгие CORS/CSRF политики, а также сквозная валидация всех действий на уровне бэкенда.
   - Эндпоинты управления пользователями защищены на уровне Django API (Permissions) и фронтенда (Protected Routes), доступ к которым имеют только пользователи со статусом `is_staff`.
4. **Real-time Engine:** Мгновенная синхронизация состояния интерфейса через WebSocket-соединения (Django Channels + Redis).
5. **Оптимизация ресурсов:** Реализована обработка сигналов отмены (Abort Signals) при скачивании файлов. Это предотвращает лишнюю нагрузку на сеть и сервер при прерывании операции пользователем.
6. **Mobile-First Approach:** Использование возможностей Tailwind CSS 4.0 для создания гибкой сетки и адаптивных компонентов без потери функциональности на малых экранах.

<br>

## 🖥️ Интерфейс и UX (User Experience)

Для обеспечения прозрачности и удобства взаимодействия реализованы следующие механизмы:

- **Всплывающие уведомления (Toasts):** Мгновенная обратная связь (успех/ошибка) при любых операциях с файлами.
- **Индикаторы прогресса:** Визуальный контроль процесса загрузки тяжелых файлов.
- **Подсказки (Tooltips):** Текстовые пояснения для всех иконок управления (через нативный атрибут `title`).
- **Персонализация:** Автоматическая генерация уникальных цветовых схем для аватаров пользователей на основе их ID, обеспечивающая стабильную визуальную идентификацию.
- **Интерактивные таблицы:** Реализована возможность быстрого редактирования метаданных (имя, описание) прямо в списке файлов, что сокращает количество кликов и ускоряет работу с контентом.
- **Мониторинг ресурсов:** Динамическая шкала квот, отображающая текущую занятость хранилища.
- **Мобильная адаптация (Responsive Design):** Интерфейс полностью оптимизирован для работы на устройствах с любым разрешением экрана. Реализовано адаптивное меню (Sidebar), перестроение таблиц данных и оптимизация модальных окон для комфортного управления файлами со смартфонов и планшетов.

<br>

## 📂 Структура проекта

### Общая структура

```text
mycloud-django-react/
├── .github/workflows/ci.yml             # CI/CD: Автоматизация (Pytest, Vitest, Ruff, ESLint) и деплой.
├── backend/                             # Серверная часть (Python, Django API & WebSockets).
├── frontend/                            # Клиентская часть (TypeScript, React SPA & Tailwind).
├── docker-compose.yml                   # Orchestrator: Описание сервисов (traefik, db, redis, backend, frontend).
├── docker-compose.override.example.yml  # Dev-Config: Шаблон локальных настроек разработки.
├── .env.example                         # Configuration: Шаблон переменных окружения и секретов.
├── .dockerignore                        # Optimization: Правила исключения файлов при сборке образов.
├── .gitignore                           # Version Control: Исключение системных и приватных данных.
├── CHANGELOG.md                         # History: История изменений проекта по версиям.
├── LICENSE                              # Legal: Юридический статус (MIT License).
└── README.md                            # Documentation: Главный технический гайд (этот файл).
```

### Структура бэкенда

```text
backend/
├── core/                  # Системное ядро проекта.
│   ├── consumers.py       # Обработка WebSocket-соединений (Real-time события).
│   ├── middleware.py      # Автоматическое логирование всех событий API.
│   ├── permissions.py     # Логика разграничения прав доступа (Owner/Admin).
│   ├── validators.py      # Глобальные валидаторы данных (пароли).
│   └── settings.py        # Конфигурация Django, Channels и Redis.
├── storage/               # Модуль управления облачным хранилищем.
│   ├── models.py          # Схема базы данных для хранения файлов и метаданных.
│   ├── views.py           # API-эндпоинты и логика X-Accel-Redirect.
│   ├── serializers.py     # Преобразование моделей в JSON и валидация входящих данных.
│   ├── signals.py         # Триггеры для автоматической отправки WS-уведомлений.
│   └── utils.py           # Вспомогательные функции для отдачи файлов, конвертации байт.
├── users/                 # Модуль управления пользователями.
│   ├── models.py          # Кастомная модель пользователя (User) с оптимизированными QuerySet (with_stats).
│   ├── views.py           # Логика регистрации, авторизации и личного кабинета (me).
│   ├── serializers.py     # Преобразование моделей в JSON и валидация входящих данных.
│   └── signals.py         # Триггеры для автоматической отправки WS-уведомлений.
├── tests/                 # Тестовое покрытие (100%).
│   ├── core/              # Тесты инфраструктуры и сокетов.
│   ├── storage/           # Интеграционные тесты API и файловой системы.
│   └── users/             # Тесты авторизации и прав доступа.
├── protected_media/       # Директория для хранения файлов, доступ к которым ограничен (через проверку прав).
├── manage.py              # Точка входа для управления Django (миграции, запуск сервера).
├── pyproject.toml         # Конфигурация зависимостей и инструментов (uv).
└── Dockerfile             # Инструкция сборки образа бэкенда.
```

### Структура фронтенда

```text
frontend/
├── src/
│   ├── api/                      # Слой взаимодействия с бэкендом - типизированные сервисы (Axios) для связи с DRF.
│   │   ├── apiClient.ts          # Настройка клиента (Base URL, настройка CSRF, обработка ошибок 401, 403).
│   │   ├── services/             # Модули для работы с конкретными API-ресурсами:
│   │   │   ├── authService.ts    # Авторизация, регистрация, обновление токенов.
│   │   │   ├── fileService.ts    # Загрузка, скачивание и управление файлами.
│   │   │   ├── adminService.ts   # Функции управления для администраторов.
│   │   │   └── __tests__/        # Покрытие тестами API-слоя и логики сервисов.
│   │   └── __tests__/            # Покрытие тестами инстанса Axios.
│   ├── store/                    # Управление состоянием (Redux Toolkit RTK 2.0):
│   │   ├── slices/               # Глобальное состояние (Redux Toolkit):
│   │   │   ├── authSlice.ts      # Управление сессией и состоянием авторизованного пользователя.
│   │   │   ├── storageSlice.ts   # Управление файловым менеджером и метаданными.
│   │   │   ├── adminSlice.ts     # Состояние панели управления пользователями.
│   │   │   └── __tests__/        # Тесты слайсов, thunks и синхронной логики.
│   │   ├── middleware/           # Логика WebSocket-соединений и фоновых процессов.
│   │   ├── hooks.ts              # Типизированные хуки (useAppSelector, useAppDispatch).
│   │   ├── actions.ts            # Глобальные экшены (unauthorizedError).
│   │   ├── createAppSlice.ts     # Фабрика/утилита для стандартизированного создания слайсов.
│   │   └── index.ts              # Конфигурация Store (Root State, Reducer, Middleware).
│   ├── utils/                    # Хелперы: форматирование, валидация, обработка ошибок.
│   │   └── __tests__/            # 100% покрытие unit-тестами функций форматирования и валидации.
│   ├── components/               # Компоненты интерфейса, разделенные по модулям:
│   │   ├── Admin/                # Таблицы и действия для управления пользователями.
│   │   ├── Dashboard/            # Основной интерфейс файлового менеджера:
│   │   │   ├── FileTable/        # Таблица файлов: отображение, сортировка и действия.
│   │   │   ├── Header/           # Панель инструментов: загрузка файлов, поиск и меню пользователя.
│   │   │   └── Sidebar/          # Навигация и индикатор использования дискового пространства.
│   │   ├── Modals/               # Модальные окна (превью файлов, подтверждения, профиль).
│   │   ├── UI/                   # Переиспользуемые атомарные компоненты (кнопки, инпуты).
│   │   └── Layout/               # Общие обертки страниц.
│   ├── pages/                    # Верхнеуровневые компоненты страниц (Routing entry points).
│   ├── routes/                   # Конфигурация путей и защищённые роуты (ProtectedRoute).
│   ├── constants/                # Константы: лимиты загрузки, тайм-ауты API и ключи конфигурации.
│   ├── types/                    # Глобальные TypeScript-интерфейсы (API, Sockets, Models).
│   ├── index.css                 # Глобальные стили и конфигурация CSS-переменных (Tailwind).
│   ├── App.tsx                   # Корневой компонент: конфигурация роутинга и глобальных макетов (Layouts).
│   └── main.tsx                  # Точка входа: инициализация React, Redux-провайдеров и рендеринг.
├── public/                       # Статические файлы, доступные по прямым ссылкам (favicon).
├── index.html                    # Шаблон приложения (SPA entry point).
├── tailwind.config.ts            # Конфигурация дизайн-системы (Tailwind).
├── vite.config.ts                # Настройки сборщика Vite (псевдонимы путей, проксирование API).
├── package.json                  # Манифест проекта: скрипты запуска и список зависимостей.
├── nginx.conf                    # Конфигурация веб-сервера для раздачи статики и SPA-роутинга.
└── Dockerfile                    # Инструкция по сборке образа (Multi-stage: build + nginx).
```

<br>

## 🌐 Облачная инфраструктура и CI/CD

Проект функционирует на мощностях **Reg.ru (Cloud VPS)** под управлением **Ubuntu 24.04 LTS**.
Выбор данной конфигурации обусловлен необходимостью высокой доступности и гибкого масштабирования ресурсов для:
- Обработки тяжелых **файловых операций** через Nginx (X-Accel-Redirect)
- Стабильного поддержания **WebSocket-соединений** в режиме реального времени
- Работы **Traefik** в качестве Edge Router для автоматического управления SSL и маршрутизации

Реализован **полный цикл CI/CD** на базе GitHub Actions: каждое слияние в ветку `main` запускает автоматическое тестирование (QA) и защищённый деплой на сервер через SSH-туннель.

<br>

## 📦 Развёртывание на Cloud VPS (Reg.ru)

Данная инструкция описывает процесс деплоя системы на чистый сервер с ОС **Ubuntu 24.04 LTS**.

### 1. Подготовка сервера

Подключиться к серверу по SSH:
```bash
ssh deploy@<your_server_ip>
```

Обновить и настроить системное ПО (выполнять под root):
```bash
# Обновить список пакетов и систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Настроить автозагрузку сервисов
sudo systemctl enable --now docker containerd systemd-timesyncd

# Включить синхронизацию времени (NTP)
sudo systemctl enable --now systemd-timesyncd

# Настроить автоматическую установку обновлений безопасности
sudo systemctl enable unattended-upgrades
```

<details>
<summary>Настройка фаервола (UFW)</summary>

```bash
# Разрешить SSH-трафик (важно, чтобы не потерять доступ!)
sudo ufw allow ssh

# Активировать фаервол
sudo ufw enable

# Включить автозапуск фаервола
sudo systemctl enable ufw
```
</details>

<details>
<summary>Создание и настройка пользователя</summary>

```bash
# Создайте пользователя
adduser deploy

# Добавить пользователя в группу sudo
usermod -aG sudo deploy

# Разрешить использование Docker без sudo
usermod -aG docker deploy

# Настроить SSH-доступ (копирование ключей из root)
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Переключиться на созданного пользователя
su - deploy
```
</details>

### 2. Подготовка приложения

Клонировать репозиторий и перейти в директорию проекта:
```bash
git clone https://github.com/Safmaxser/mycloud-django-react.git
cd mycloud-django-react
```

Настройка окружения:

> ⚠️ Все команды выполняются внутри директории **mycloud-django-react**.

```bash
# Создать файл .env на основе шаблона
cp .env.example .env

# Открыть файл для редактирования
nano .env
```

Перед запуском необходимо заполнить все параметры в файле .env

<details>
<summary> Полный список переменных окружения (.env)</summary>

| Переменная | Описание | Значения (Пример) |
| :--- | :--- | :--- |
| **Network & Identity** |  |  |
| `SITE_PROTOCOL` |	Протокол работы приложения | `https` / `http` |
| `SITE_DOMAIN` | Домен или IP для маршрутизации Traefik | `yourdomain.ru` |
| `SITE_IP` |	Публичный IP-адрес VPS |	`95.163.x.x` |
| `ACME_EMAIL` | Email для уведомлений Let's Encrypt | `admin@mail.ru` |
| **SSL & Traefik** |  |  |
| `ENABLE_SSL` | Включение автоматического выпуска SSL-сертификата | `true` / `false` |
| `TRAEFIK_ENTRYPOINT` | Точка входа трафика (443 или 80 порт) | `websecure` / `web` |
| **Database (PostgreSQL)** |  |  |
| `DB_NAME` | Имя базы данных проекта | `cloud_db` |
| `DB_USER` | Имя пользователя базы данных | `my_user` |
| `DB_PASSWORD` | Безопасный пароль от базы данных | `********` |
| `DB_HOST` | Хост сервиса БД | `db` |
| `DB_PORT` | Порт сервиса БД | `5432` |
| **Infrastructure** |  |  |
| `DOCKER_REGISTRY_MIRROR` | Зеркало Docker Hub для ускорения сборки | `cr.yandex/mirror/` |
| `BASE_REDIS_URL` | Базовый URL для подключения к Redis | `redis://redis:6379` |
| **CORS & Cookies** |  |  |
| `CORS_ALLOWED_ORIGINS` | Разрешенные адреса для CORS-запросов | `https://yourdomain.ru` |
| `CSRF_TRUSTED_ORIGINS` | Доверенные адреса для CSRF-защиты | `https://yourdomain.ru` |
| `SESSION_COOKIE_SECURE` | Передача куки сессии только через HTTPS | `true` / `false` |
| `CSRF_COOKIE_SECURE` | Передача CSRF-куки только через HTTPS | `true` / `false` |
| **Storage & Limits** |  |  |
| `STORAGE_QUOTA_BYTES` | Общая квота диска на одного пользователя (в байтах) | `2147483648` |
| `MAX_FILE_SIZE_BYTES` | Максимальный размер загружаемого файла (в байтах) | `524288000` |
| `FILE_SERVE_METHOD` | Метод отдачи файлов | `nginx` / `django` |
| **Security & Django** |  |  |
| `DEBUG` | Режим отладки (должен быть выключен в продакшене) | `false` / `true` |
| `SECRET_KEY` | Секретный ключ Django для защиты сессий | `django-insecure-xxx` |
| `ALLOWED_HOSTS` | Список разрешенных хостов (Домен + IP) | `yourdomain.ru,95.163.x.x,localhost,127.0.0.1` |
</details>

### 3. Инициализация хранилища SSL-сертификатов

> ⚠️ Все команды выполняются внутри директории **mycloud-django-react**.

```bash
# Создать директорию для сертификатов
mkdir -p letsencrypt

# Создать пустой файл для хранения данных ACME
touch letsencrypt/acme.json

# Установить права доступа (обязательно 600 для работы Traefik)
chmod 600 letsencrypt/acme.json
```

### 4. Сборка и запуск проекта



> ⚠️ Все команды выполняются внутри директории **mycloud-django-react**.

```bash
# Запустить контейнеры в фоновом режиме
docker compose up -d --build

# Применить миграции (создание таблиц)
docker compose exec backend python manage.py migrate

# Создать администратора Django
docker compose exec backend uv run python manage.py createsuperuser
```

### 5. Обслуживание и мониторинг

> ⚠️ Все команды выполняются внутри директории **mycloud-django-react**.

```bash
# Просмотр логов всех сервисов в реальном времени
docker compose logs -f

# Перезапуск всех сервисов приложения
docker compose restart

# Остановка проекта без удаления данных
docker compose down
```

### 6. Тестирование (Health Check)

После запуска убедитесь, что все компоненты системы работают корректно:

> ⚠️ Все команды выполняются внутри директории **mycloud-django-react**.

```bash
# Проверка бэкенда (Pytest)
docker compose exec backend pytest

# Проверка фронтенда (Yarn + Vitest)
docker compose exec frontend yarn test:run
```

<br>

## 📄 Лицензия

Этот проект распространяется под лицензией **MIT**. Подробности в файле [LICENSE](LICENSE).

<br>

## ✍️ Автор и контакты

<p align="center">
  Made with ❤️ by <b><a href="https://github.com/Safmaxser">Maksim Safonov</a></b>
</p>

<p align="center">
  <a href="https://github.com/Safmaxser">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
</p>
