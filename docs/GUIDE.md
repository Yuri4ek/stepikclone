# КодСтарт — полный гайд по платформе

Платформа дистанционной подготовки школьников 1–9 классов по спортивному программированию для Федерации спортивного
программирования Чувашской Республики. По устройству близка к Stepik: курс собирается из шагов, ученик проходит
их сам, автопроверка отвечает сразу, куратор проверяет то, что не проверит машина, администратор собирает курсы.

Содержание:

1. [Роли и что видит каждая](#1-роли-и-что-видит-каждая)
2. [Как устроен курс](#2-как-устроен-курс)
3. [Проверка, прогресс, рейтинг, отставание](#3-проверка-прогресс-рейтинг-отставание)
4. [Архитектура в целом](#4-архитектура-в-целом)
5. [Бэкенд](#5-бэкенд)
6. [Фронтенд](#6-фронтенд)
7. [База данных](#7-база-данных)
8. [Демо-данные](#8-демо-данные)
9. [Деплой с Docker](#9-деплой-с-docker)
10. [Как добавить новый тип шага](#10-как-добавить-новый-тип-шага)

---

## 1. Роли и что видит каждая

Все демо-пароли — `demo1234`. Гость видит лендинг (`/`) и справку «Как это работает» (`/help`), может
зарегистрироваться как ученик (`/register`). Кураторов и администраторов заводит администратор.

### Ученик (`student@example.com` — Анна)

| Экран | Адрес | Что там |
|---|---|---|
| Главная | `/learn` | Крупная тёмная карточка «Следующий шаг», серия дней подряд, возвращённые работы с комментарием куратора, прогресс по каждому курсу и место в группе |
| Курсы | `/catalog` | Каталог опубликованных курсов: классы, число шагов, «Начать курс» |
| Курс | `/courses/:id` | Карта курса «где я и что дальше» (текущий шаг — синий ореол), оглавление по модулям со статусами, паспорт курса (классы, объём, инструмент) |
| Шаг | `/courses/:id/steps/:stepId` | Плеер шага под его тип, результат проверки, «Вопрос куратору», кнопки «Назад» / «Следующий шаг» |
| Прогресс и баллы | `/courses/:id/progress` | Сколько баллов и откуда (автопроверка / куратор / ждёт проверки / ещё можно), формула рейтинга, место в группе, серия, что делать дальше |
| Мои работы | `/history` | Все отправки со статусами, результатами тестов и комментариями; зачтённые задания; свои вопросы куратору |
| Профиль | `/profile` | Данные пользователя |

Интерфейс ученика крупнее (кегль 18, кнопки 56 px) и обращается на «ты».

### Куратор (`curator@example.com`)

| Экран | Адрес | Что там |
|---|---|---|
| Обзор | `/curator` | Сколько работ ждёт, сколько ждёт дольше суток, вопросы без ответа, кто выпадает и замедлился |
| Очередь проверки | `/curator/queue` | Таблица работ: ученик и его уровень отставания, шаг и его тип, превью ответа, сколько ждёт |
| Карточка работы | `/curator/review/:id` | Ответ ученика (ссылка, встроенный проект Scratch, скриншот, комментарий), задание, критерии, баллы, «Зачесть» / «Вернуть с комментарием», переход к следующей работе |
| Ученики | `/curator/lag` | Все ученики курсов куратора: «В графике», «Замедлился», «Выпадает» и конкретные причины |
| Вопросы | `/curator/questions` | Вопросы учеников по шагам; ответ ученик увидит прямо на шаге |

Куратор видит только курсы, на которые его назначил администратор.

### Администратор (`admin@example.com`)

| Экран | Адрес | Что там |
|---|---|---|
| Курсы | `/admin` | Все курсы, включая черновики; создание курса |
| Конструктор | `/admin/courses/:id` | Слева дерево: модули → уроки → шаги (добавить, удалить, поменять порядок). Справа — настройки курса или редактор шага |
| Пользователи | `/admin/users` | Ученики, кураторы, администраторы; курсы каждого; запись и назначение на курс; создание пользователя |

В настройках курса: название, описание, паспорт (классы, объём, инструмент, цель), обложка, публикация и снятие
с публикации, кураторы курса (назначить / снять), ученики курса (записать / отчислить). В редакторе шага —
форма под тип шага и вкладка «Глазами ученика». Администратору доступны и все экраны куратора.

---

## 2. Как устроен курс

```
Курс ── паспорт (классы, объём, инструмент, цель)
 └─ Модуль
     └─ Урок
         └─ Шаг ── kind (механизм проверки) + content (JSON, в нём content.type — вид шага)
```

В пакете содержания Федерации уровня «урок» нет: курс → модуль → шаг. Поэтому каждый модуль пакета получил один урок
с тем же названием, а интерфейс ученика такой урок не показывает — шаги идут сразу под модулем.

### Шаг = механизм проверки + вид

| Тип (что видит ученик) | `kind` | `content.type` | Как проверяется | Что сдаёт ученик |
|---|---|---|---|---|
| Теория | `theory` | `theory` | засчитывается при прочтении | — |
| Контрольный вопрос | `quiz` | `quiz` | сразу; один или несколько верных вариантов | выбор |
| Вопрос с ответом числом | `quiz` | `answer` | сразу | число или слово |
| Scratch: разбор с ответом | `quiz` | `scratch_answer` | сразу | число |
| Задача с тестами | `code` | `algo` | сразу: прогон на сервере по всем тестам | код на Python 3 |
| Scratch: проект по ссылке | `task` | `scratch` | куратор | ссылка на проект Scratch |
| Minecraft Education | `task` | `minecraft` | куратор | скриншот + ссылка на MakeCode |
| Проект | `task` | `project` | куратор | ссылка / скриншот / текст — по настройке шага |

Почему два поля: механизмов проверки мало (ответ, тесты, куратор), а видов шагов может быть сколько угодно.
Новый вид на существующей проверке («Робототехника» с ручной проверкой) не требует изменений бэкенда и базы —
только модуль во фронтенде. Подробно — в [разделе 10](#10-как-добавить-новый-тип-шага).

### Что скрыто от ученика

В `content` шага лежат и служебные поля пакета: правильные ответы, критерии проверки, эталонное решение,
подсказка, скрытые тесты. Сервер вырезает их, прежде чем отдать шаг ученику, — куратор и администратор видят всё.

### Блочные программы

Программы Scratch и MakeCode в пакете записаны текстом. Так они и хранятся — в Markdown-блоке ` ```blocks `:

````markdown
```blocks
[Циклы] повторить 4 раз
    [Агент] агент перемещается вперёд на 3     ← пояснение на полях
    [Агент] агент поворачивает направо
конец
```
````

Одна строка — один блок, отступ 4 пробела — вложенность, «конец» закрывает цикл, `[Раздел]` — раздел палитры,
`(10)` — окошко со значением, `<касается края?>` — условие. Фронтенд рисует это стопкой блоков.

---

## 3. Проверка, прогресс, рейтинг, отставание

### Проверка

- **Автоматическая** — результат сразу. Ответ числом сравнивается без учёта пробелов и регистра, «3,5» = «3.5»,
  «45» = «45.0». В вопросе с несколькими верными нужно выбрать ровно все верные. После неверного ответа показывается
  подсказка из пакета, если она есть.
- **Задача с тестами** — код уходит на сервер, прогоняется на каждом тесте в отдельном процессе с ограничением
  времени и памяти из паспорта задачи. Вердикты: `OK`, `WA` (неверный ответ), `TLE` (превышено время),
  `RE` (ошибка при выполнении), `ML` (превышена память). Для примеров из условия ученик видит ввод, ожидаемый ответ
  и свой вывод; для скрытых тестов — только вердикт. «Проверить на примерах» запускает код прямо в браузере
  и попытку не тратит.
- **Ручная** — работа уходит в очередь куратора. Куратор принимает её с баллами (0…максимум) или возвращает
  с обязательным комментарием. Ученик видит статус и причину возврата на шаге и на главной.

### Шесть статусов шага

| Статус | Когда |
|---|---|
| Не начато (замок) | шаг ещё закрыт |
| В процессе | шаг открыт, ответа нет |
| На проверке | работа у куратора |
| Возвращено | куратор вернул с комментарием |
| Не прошло тесты / Не прошло проверку | автопроверка не пройдена, можно отправить снова |
| Зачтено | пройдено; мелкая подпись — «проверено автоматически» или «проверил куратор» |

### Как открываются шаги

Шаги идут по порядку. Следующий шаг открывается, когда текущий **зачтён, сдан на проверку или возвращён**:
ученик не ждёт куратора. «Текущий шаг» (карточка «Следующий шаг») — первый, где от ученика ждут действия;
возвращённые работы становятся текущими, когда больше делать нечего. Автопроверку можно пройти ещё раз —
в зачёт идёт лучший результат; зачтённую куратором работу повторно не сдают.

### Прогресс и рейтинг

- **Процент курса** = зачтённые обязательные шаги ÷ все обязательные шаги. Теория тоже считается.
- **Рейтинг курса** = набранные баллы ÷ сумма баллов всех обязательных шагов × 100. Баллы куратора и автопроверки
  весят одинаково. Работа на проверке даёт баллы, когда её примут; до этого она показана как «ждут проверки».
- **Место в группе** — по рейтингу среди всех записанных на курс, при равенстве — по проценту.
  Имена других учеников сокращаются («Мария К.»).
- **Серия** — сколько дней подряд (по московскому времени) ученик что-то сдал или прошёл, по всем курсам.

### Отставание — чтобы куратор увидел проблему заранее

| Сигнал | Порог | Уровень |
|---|---|---|
| Не заходит | 3+ дня / 7+ дней | Замедлился / Выпадает |
| Заходит, но не продвигается | 4+ дня / 10+ дней | Замедлился / Выпадает |
| Застрял на шаге | 3+ неудачные попытки на текущем шаге | Замедлился |
| Не исправляет возвращённую работу | 2+ дня | Замедлился |
| Отстаёт от группы | на 30+ п. п. ниже медианы (в группе от 3 человек) | Замедлился |
| Три тревожных сигнала сразу | — | Выпадает |

Пороги — константы в начале `backend/app/slices/lag/service.py`. Ученик свои пометки не видит.

---

## 4. Архитектура в целом

```
Браузер ──► Фронтенд (React SPA, статика в nginx)
   │
   └─────► Бэкенд (FastAPI, /api/v1, /uploads) ──► PostgreSQL 16
                    │
                    └─ прогон решений: подпроцесс python3 на каждый тест
```

- Авторизация — JWT (HS256, живёт 24 часа), фронтенд хранит его в `localStorage` и шлёт в `Authorization: Bearer`.
- Картинки (обложки, картинки теории, скриншоты учеников) лежат на диске бэкенда в `uploads/` и раздаются по `/uploads/...`.
- В продакшене всё стоит за одним доменом: Caddy отправляет `/api`, `/uploads`, `/docs` на бэкенд, остальное — на фронтенд.

---

## 5. Бэкенд

**Стек:** Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 16 (драйвер psycopg 3), Pydantic 2, python-jose (JWT), passlib/bcrypt.

### Структура `backend/`

```
app/
  main.py              сборка приложения, CORS, роутеры, раздача /uploads
  core/                настройки (.env), подключение к БД, JWT и пароли, зависимости (текущий пользователь, роли), загрузка картинок
  models/              таблицы SQLAlchemy
  steps/
    registry.py        реестр механизмов проверки: как проверять, что скрыть от ученика
    judge.py           прогон кода по тестам
  slices/              вертикальные срезы: router.py (эндпоинты) + service.py (логика) + schemas.py (Pydantic)
    auth  catalog  learning  questions  reviews  progress  lag  course_builder
  seed/
    package_courses.py пакет содержания Федерации: 3 курса, 30 шагов
    run.py             заливка демо-данных
alembic/versions/      миграции 001, 002, 003
docker-entrypoint.sh   миграции + seed при старте контейнера
```

### Эндпоинты (`/api/v1`, полный список — Swagger `/docs`)

| Срез | Метод и путь | Кто | Что делает |
|---|---|---|---|
| auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` | все | вход, регистрация ученика, текущий пользователь |
| catalog | `GET /catalog/courses` | все | курсы с паспортом и записью пользователя |
| | `POST /catalog/courses/{id}/enroll` | ученик | записаться |
| | `GET /catalog/courses/{id}/outline` | все | оглавление со статусами и `type` шагов |
| | `GET /catalog/courses/{id}/next` | ученик | текущий шаг и подсказка, что делать |
| learning | `GET /learning/steps/{id}` | ученик | шаг без скрытых полей + прогресс + последняя отправка |
| | `POST /learning/steps/{id}/complete` | ученик | отметить теорию |
| | `POST /learning/steps/{id}/submit` | ученик | отправить ответ: результат сразу или в очередь |
| | `GET /learning/submissions` | ученик | история отправок |
| | `POST /learning/uploads` | ученик | загрузить скриншот, вернуть URL |
| questions | `POST /questions/steps/{id}`, `GET /questions/steps/{id}`, `GET /questions/mine` | ученик | задать и посмотреть вопросы |
| | `GET /questions/inbox`, `POST /questions/{id}/answer` | куратор, админ | входящие и ответ |
| reviews | `GET /reviews/queue`, `GET /reviews/submissions/{id}` | куратор, админ | очередь и карточка работы |
| | `POST /reviews/submissions/{id}/accept`, `/return` | куратор, админ | принять с баллами / вернуть с комментарием |
| progress | `GET /progress/courses/{id}`, `GET /progress/courses/{id}/leaderboard` | записанный | прогресс, рейтинг с расшифровкой, место, серия |
| lag | `GET /lag/students?include_ok=true` | куратор, админ | ученики и сигналы отставания |
| admin | `/admin/courses…`, `/admin/modules…`, `/admin/lessons…`, `/admin/steps…` | админ | конструктор курса |
| | `POST /admin/courses/{id}/publish`, `/unpublish` | админ | публикация |
| | `GET /admin/courses/{id}/people`, `POST/DELETE …/curators`, `POST/DELETE …/students` | админ | кураторы и ученики курса |
| | `GET/POST /admin/users`, `GET /admin/step-kinds`, загрузки картинок и обложек | админ | пользователи, механизмы проверки |

Куратор получает данные только своих курсов (таблица `course_curators`), администратор — все.

### Реестр проверки (`app/steps/registry.py`)

Каждый механизм — запись `Checker`: `kind`, режим (`none` / `auto` / `manual`), функция проверки, проверка формата
ответа, фильтр того, что видит ученик. Отправка ответа в `learning/service.py` не знает ничего о конкретных типах:
она берёт механизм из реестра по `step.kind` и вызывает его.

### Прогон решений (`app/steps/judge.py`)

- Каждый тест — отдельный процесс `python3 -I -S solution.py` во временной папке, с пустым окружением.
- Лимиты: CPU (время задачи), память (`RLIMIT_AS`, работает на Linux), размер вывода 1 МБ; стенной таймаут —
  двойное время + 0,5 с. После двух превышений времени остальные тесты не гоняются.
- Одновременно — не больше `JUDGE_CONCURRENCY` прогонов (по умолчанию 4).
- В Docker решение выполняется от пользователя `judge`: ему недоступны `/backend` и окружение сервера (секреты).
- Сеть у решения не отключена. Для большой нагрузки и полной изоляции прогон стоит вынести в отдельный воркер
  (nsjail / gVisor, очередь заданий).

### Настройки (переменные окружения)

| Переменная | По умолчанию | Что это |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://stepik:stepik@localhost:5433/stepikclone` | подключение к БД (драйвер обязательно `postgresql+psycopg`) |
| `SECRET_KEY` | `dev-secret-change-me` | подпись JWT — в продакшене обязательно своя |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 1440 | срок жизни входа |
| `CORS_ORIGINS` | `http://localhost:5173,…` | откуда можно ходить в API, через запятую; `*` — откуда угодно |
| `UPLOAD_DIR` | `uploads` | папка загрузок |
| `JUDGE_CONCURRENCY` | 4 | параллельные прогоны решений |
| `SEED_DEMO` | 1 | (Docker) залить демо-данные в пустую базу |

---

## 6. Фронтенд

**Стек:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, react-markdown. Шрифты Onest и JetBrains Mono,
цвета и радиусы — из брендбука (`src/app/styles/tokens.css`, `tailwind.config.js`).

### Слои (Feature-Sliced Design)

```
src/
  app/        точка сборки: провайдеры, роутер, гарды доступа по ролям, стили
  pages/      экраны: landing, auth, catalog, course, step, progress, history, dashboard,
              curator-overview, review-queue, review, lag, questions, admin-courses, course-builder, admin-users, help
  widgets/    составные блоки: шапка и меню, карта и оглавление курса, «Следующий шаг», расшифровка баллов
  features/   действия: вход, запись на курс, ответ на шаг, вопрос куратору, ответ на вопрос, проверка работы,
              создание курса, настройки курса и люди курса, структура курса, редактор шага
  entities/   сущности: session, user, course, step (реестр типов), submission, question, lag
  shared/     без бизнес-логики: api (HTTP-клиент и типы), ui (кнопки, формы, статусы, иконки, Markdown, блоки), lib
```

Правило: слой импортирует только из слоёв ниже, чужой слайс — только через его `index.ts`. Запросы к API лежат
в сегменте `api` того слайса, которому принадлежат. Алиас `@/` → `src/`.

### Ключевые места

- `shared/api/client.ts` — HTTP-клиент: адрес из `VITE_API_URL`, токен, разбор ошибок FastAPI, приведение
  `Decimal`-строк (`"10.00"`) к числам, при 401 — выход.
- `app/router/AppRouter.tsx` и `guards.tsx` — маршруты и доступ по ролям; `/` ведёт вошедшего в его кабинет.
- `entities/step/model/registry.ts` — реестр типов шагов; `entities/step/ui/step-types/*` — по файлу на тип
  (редактор, плеер, вид для куратора).
- `entities/step/ui/common.tsx` — общая форма сдачи работы (ссылка / скриншот / текст по настройке шага).
- `shared/ui/BlockProgram.tsx` и `Markdown.tsx` — отрисовка ` ```blocks `.
- `shared/lib/code-runner` — Pyodide в Web Worker для «Проверить на примерах».
- Черновики ответов сохраняются в браузере (`useDraft`), чтобы не потерять их при перезагрузке и после возврата работы.

### Команды

```bash
npm run dev      # dev-сервер на 5173
npm run build    # проверка типов + сборка в dist/
npm run lint     # oxlint
```

---

## 7. База данных

PostgreSQL 16. Схема управляется Alembic (`backend/alembic/versions`). Все ключи — UUID.

```mermaid
erDiagram
    users ||--o{ enrollments : "учится"
    users ||--o{ course_curators : "курирует"
    users ||--o{ step_progress : ""
    users ||--o{ submissions : "сдаёт"
    users ||--o{ step_questions : "спрашивает"
    courses ||--o{ modules : ""
    courses ||--o{ course_curators : ""
    courses ||--o{ enrollments : ""
    modules ||--o{ lessons : ""
    lessons ||--o{ steps : ""
    steps ||--o{ step_progress : ""
    steps ||--o{ submissions : ""
    steps ||--o{ step_questions : ""
    enrollments ||--|| course_progress : ""
    course_progress }o--o| steps : "текущий шаг"
```

### Таблицы

**Пользователи и курсы**

| Таблица | Поля | Заметки |
|---|---|---|
| `users` | `email` (уникальный), `password_hash` (bcrypt), `full_name`, `role` (student / curator / admin), `created_at`, `last_seen_at` | `last_seen_at` обновляется не чаще раза в минуту |
| `courses` | `slug` (уникальный), `title`, `description`, `cover_url`, `passport` (JSONB), `status` (draft / published), `created_by`, `created_at`, `updated_at` | `passport` — `{grades, volume, tool, goal}` |
| `modules` | `course_id`, `title`, `position` | удаляются вместе с курсом |
| `lessons` | `module_id`, `title`, `position` | |
| `steps` | `lesson_id`, `title`, `position`, `kind` (строка), `content` (JSONB), `max_score`, `is_required` | `kind` — строка, а не enum: механизмы проверки живут в коде |
| `course_curators` | `course_id`, `user_id` | уникальная пара; кого куратор видит |

**Обучение**

| Таблица | Поля | Заметки |
|---|---|---|
| `enrollments` | `user_id`, `course_id`, `status` (active / completed), `enrolled_at` | запись на курс, уникальная пара |
| `step_progress` | `user_id`, `step_id`, `status`, `score`, `best_score`, `attempts_count`, `completed_at`, `updated_at` | статусы: locked, available, in_progress, submitted, returned, passed, failed. Строки создаются при записи на курс; при отчислении остаются — вернувшийся ученик продолжит с того же места |
| `course_progress` | `enrollment_id` (1:1), `completed_steps`, `total_required_steps`, `percent`, `current_step_id`, `rating_score`, `rating_breakdown` (JSONB), `updated_at` | кэш прогресса; пересчитывается после каждого действия ученика и проверки куратора. `current_step_id` при удалении шага обнуляется |
| `submissions` | `user_id`, `step_id`, `payload` (JSONB — ответ), `check_type` (auto / manual), `status` (pending / graded / returned), `score`, `feedback`, `result` (JSONB — вердикты тестов), `reviewed_by`, `created_at`, `reviewed_at` | каждая попытка — отдельная строка |
| `step_questions` | `step_id`, `course_id`, `user_id`, `text`, `status` (open / answered), `answer`, `answered_by`, `created_at`, `answered_at` | вопрос ученика по шагу и ответ куратора |

### Формат `content` по типам

```jsonc
// theory
{ "type": "theory", "markdown": "…", "video_url": "" }

// quiz — один верный / несколько верных
{ "type": "quiz", "question": "…", "options": [{ "id": "a", "text": "…" }], "correct_option_id": "b" }
{ "type": "quiz", "question": "…", "options": [...], "multiple": true, "correct_option_ids": ["a", "c"] }

// answer и scratch_answer — ответ числом
{ "type": "answer", "question": "…", "correct_answer": "45", "accepted_answers": [], "answer_kind": "number", "hint": "…" }
{ "type": "scratch_answer", "markdown": "```blocks …```", "question": "…", "correct_answer": "0", "hint": "…" }

// algo — задача с тестами
{ "type": "algo", "markdown": "условие", "language": "python", "time_limit_ms": 1000, "memory_limit_mb": 256,
  "tests": [{ "input": "2 3", "output": "5", "sample": true }, { "input": "0 0", "output": "0", "sample": false }],
  "reference_solution": "…", "starter_code": "" }

// scratch / minecraft / project — ручная проверка
{ "type": "minecraft", "world": "Плоский мир…", "markdown": "…", "criteria": "…",
  "submit": { "link": "required", "screenshot": "required", "text": "optional" }, "link_kind": "makecode" }
```

Скрытые от ученика поля: `correct_option_id`, `correct_option_ids`, `correct_answer`, `accepted_answers`, `criteria`,
`reference_solution`, `hint`, `explanation` и тесты без `"sample": true`.

Что сдаёт ученик (`submissions.payload`): `{selected_option_id}`, `{selected_option_ids}`, `{answer}`,
`{code, language}` или `{text, link, screenshot_url}`.

### Миграции

| Миграция | Что делает |
|---|---|
| `001_initial` | исходная схема |
| `002_cover` | обложка курса |
| `003_step_types` | `steps.kind` из enum в строку; `courses.passport`; `submissions.result`; таблица `step_questions`; индексы; `ON DELETE SET NULL` для текущего шага |

```bash
alembic upgrade head          # применить
alembic downgrade -1          # откатить последнюю
alembic revision -m "…"       # новая миграция (писать руками по образцу 003)
```

---

## 8. Демо-данные

`backend/app/seed/run.py` заливает курсы из пакета (`package_courses.py`) и вымышленных учеников в разных состояниях:
очередь проверки, возвращённые работы, все виды отставания, вопросы с ответом и без. При заливке эталонные решения
задач прогоняются через настоящий прогон по тестам — если тест перенесён с ошибкой, seed упадёт.

```bash
PYTHONPATH=. python -m app.seed.run            # только в пустую базу
PYTHONPATH=. python -m app.seed.run --force    # стереть всё и залить заново
PYTHONPATH=. python -m app.seed.run --force --legacy   # плюс старые курсы-заглушки
```

Учётные записи: `admin@`, `curator@`, `curator2@`, `student@` (Анна), `ivan@`, `maria@`, `dima@`, `sofia@`, `artem@`,
`polina@`, `kirill@`, `eva@`, `timur@`, `new@example.com` (ещё никуда не записан). Пароль `demo1234`.

---

## 9. Деплой с Docker

В репозитории три файла для Docker Compose:

| Файл | Зачем |
|---|---|
| `docker-compose.yml` | база, бэкенд, фронтенд — для локального запуска |
| `docker-compose.prod.yml` | дополнение для сервера: пароли и ключи из переменных, наружу открыт только Caddy (80/443), автоперезапуск |
| `Caddyfile` | один домен с HTTPS: `/api`, `/uploads`, `/docs` → бэкенд, остальное → фронтенд |

Контейнеры: `stepikclone-db` (PostgreSQL), `stepikclone-backend` (при старте выполняет миграции, затем seed,
если `SEED_DEMO=1` и база пустая), `stepikclone-frontend` (nginx со сборкой SPA), `stepikclone-caddy` (только на сервере).
Тома: `stepikclone_pgdata` — база, `stepikclone_uploads` — загруженные картинки, `caddy_data` — сертификаты.

### 9.1. Локально

```bash
docker compose up --build
```

- фронтенд — http://localhost:3000, API — http://localhost:8000, Swagger — http://localhost:8000/docs, база — `localhost:5433`
- остановить — `docker compose down`; стереть и базу — `docker compose down -v`

Если Docker ругается `The container name "/stepikclone-db" is already in use` — остался контейнер от старого запуска.
Посмотрите `docker ps -a`, при необходимости удалите его: `docker rm -f stepikclone-db` (данные лежат в томе, сам том не удаляется).

### 9.2. На сервере

**Что нужно:** Linux-сервер с Docker Engine и плагином Compose (2 ГБ RAM хватит), домен, свободные порты 80 и 443.

**1. DNS.** Создайте A-запись домена (например, `kodstart.example.ru`) на IP сервера. Caddy получит сертификат
Let's Encrypt сам, но только когда домен уже указывает на сервер.

**2. Код и настройки.**

```bash
git clone <адрес репозитория> kodstart && cd kodstart
cp .env.prod.example .env.prod
nano .env.prod
```

```ini
DOMAIN=kodstart.example.ru
POSTGRES_PASSWORD=длинный-случайный-пароль     # применяется только при первом создании базы
SECRET_KEY=результат-openssl-rand-hex-32
SEED_DEMO=1                                      # 0 — чистая платформа без демо-данных
```

`SECRET_KEY` сгенерировать: `openssl rand -hex 32`. `.env.prod` в git не попадает.

**3. Запуск.**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

При сборке фронтенд получает адрес API `https://$DOMAIN`; все запросы идут на тот же домен, CORS разрешён только ему.

**4. Проверка.**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod ps
docker logs stepikclone-backend | head -20     # «Running upgrade …», «Seed OK», «Application startup complete»
curl https://kodstart.example.ru/api/v1/catalog/courses   # 401 «Not authenticated» — значит API живо
```

Откройте `https://kodstart.example.ru`, войдите как `admin@example.com` / `demo1234`.
**Если демо-данные залиты, смените пароли демо-учётных записей или создайте свои и не публикуйте demo-пароли.**

Чтобы не писать длинную команду каждый раз:

```bash
alias dc='docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod'
dc ps; dc logs -f backend; dc restart backend
```

### 9.3. Обновление

```bash
git pull
dc up -d --build        # пересоберёт образы; миграции применятся при старте бэкенда
```

Данные в томах сохраняются. Seed без `--force` существующую базу не трогает.

### 9.4. Резервные копии

```bash
# база
dc exec -T db pg_dump -U stepik -d stepikclone -Fc > backup-$(date +%F).dump
# загруженные картинки
docker run --rm --volumes-from stepikclone-backend -v "$PWD":/out alpine tar czf /out/uploads-$(date +%F).tgz -C /backend/uploads .
```

Восстановление базы:

```bash
dc exec -T db pg_restore -U stepik -d stepikclone --clean --if-exists < backup-2026-09-26.dump
```

Восстановление картинок — в обратную сторону: `docker run --rm --volumes-from stepikclone-backend -v "$PWD":/in alpine tar xzf /in/uploads-2026-09-26.tgz -C /backend/uploads`.

### 9.5. Полезные команды

```bash
dc logs -f backend                                              # логи API
dc exec backend alembic current                                 # версия схемы
dc exec backend sh -c 'PYTHONPATH=. python -m app.seed.run --force'   # перезалить демо-данные (сотрёт всё!)
dc exec db psql -U stepik -d stepikclone                        # консоль базы
```

### 9.6. Частые проблемы

| Симптом | Причина и решение |
|---|---|
| Сайт открывается, но «Сервер недоступен» | Фронтенд собран с другим `DOMAIN` / `VITE_API_URL`. Исправьте `.env.prod` и `dc up -d --build frontend` |
| Нет HTTPS, Caddy пишет об ошибке сертификата | Домен ещё не указывает на сервер или закрыты порты 80/443 |
| Бэкенд падает с `password authentication failed` | Сменили `POSTGRES_PASSWORD` после создания базы. Верните старый или смените пароль внутри Postgres (`ALTER USER stepik PASSWORD '…'`) |
| `could not translate host name "db"` | Бэкенд запущен без compose-сети — запускайте через `docker compose` |
| Задачи с тестами всегда TLE | Сервер перегружен: уменьшите `JUDGE_CONCURRENCY` или добавьте CPU |
| Загрузка картинки отклонена | Допустимы PNG, JPG, WEBP, GIF до 5 МБ |

---

## 10. Как добавить новый тип шага

**Вариант А — новый вид на существующей проверке** (например, «Робототехника» с ручной проверкой). Бэкенд и база не меняются.

1. Создайте `frontend/src/entities/step/ui/step-types/robotics.tsx` по образцу `minecraft.tsx`:

   ```tsx
   export const roboticsStep: StepTypeDef = {
     id: 'robotics',            // уйдёт в content.type
     kind: 'task',              // механизм проверки: куратор
     label: 'Робототехника',
     description: 'Сборка и программирование робота, ученик сдаёт видео.',
     group: 'Робототехника',
     icon: 'cube',
     check: 'manual',
     defaultMaxScore: 20,
     defaultContent: () => ({ type: 'robotics', markdown: '', criteria: '', submit: { link: 'required', screenshot: 'optional', text: 'optional' } }),
     Editor: …,                 // форма для администратора
     Player: …,                 // что видит ученик (можно взять ManualSubmitForm)
   }
   ```

2. Добавьте его в `STEP_TYPES` в `entities/step/model/registry.ts`.

Всё. Тип появится в выборе типа шага в конструкторе, очередь и прогресс заработают автоматически.
Даже если какой-то клиент ещё не знает `robotics`, шаг откроется общим плеером механизма `task`.

**Вариант Б — новый механизм проверки** (например, сравнение с эталонным изображением).

1. В `backend/app/steps/registry.py` напишите функцию проверки `grade(content, answers, max_score) -> GradeResult`
   и зарегистрируйте механизм:

   ```python
   register(Checker(kind="image", mode="auto", label="Сравнение с эталоном", default_type="image",
                    grade=grade_image, validate_answers=validate_image))
   ```

2. Если у механизма есть новые секретные поля в `content` — добавьте их в `extra_private`.
3. Сделайте тип во фронтенде с `kind: 'image'` (вариант А).

Миграция не нужна: `steps.kind` — строка, `content` — JSON.
