# База данных — матрица компетенций

Инструкция по развёртыванию и миграции схемы БД для функциональности матрицы компетенций, дашбордов и роли lead.

## Предварительные требования

- PostgreSQL
- База `growdb`, пользователь `grow_app` (см. [INSTALL.md](../INSTALL.md))
- Файл `api/.env` с параметрами подключения (как в `db.js`)

## Актуальная схема (кратко)

| Объект | Назначение |
|--------|------------|
| `teams` | Команды; опциональная привязка к каталогу через `catalog_id` |
| `users` | Пользователи; роли `user` / `admin` / `lead`, поля `team_id`, `grade`, `job_title` |
| `user_managed_teams` | Команды, которыми управляет пользователь с ролью `lead` |
| `competency_catalogs` | Независимые каталоги компетенций (без привязки к команде) |
| `competency_blocks`, `competency_domains`, `competencies` | Иерархия каталога |
| `grade_targets` | Целевые диапазоны оценок по блоку и грейду |
| `assessment_cycles` | Циклы оценки по команде и каталогу |
| `competency_assessments` | Оценки компетенций в рамках цикла |
| `cycle_user_snapshots` | Снимок грейда сотрудника на момент цикла |
| `points` | ИПР; опциональная связь с компетенцией через `competency_id` |

**Модель каталогов:** каталог создаётся отдельно от команды. Команда ссылается на каталог через `teams.catalog_id`. Несколько команд могут использовать один каталог.

## С чистой БД

Подходит для новой установки, когда таблиц ещё нет.

```bash
cd api
npm install
npm run init    # полная схема из init.sql (включая lead, managed teams, decoupled catalogs)
npm run seed    # каталог + Default Team + привязка каталога к команде + назначение пользователей
```

**Что создаёт `seed`:**
- каталог `Competency Matrix` (29 компетенций, 5 блоков, grade targets)
- команду `Default Team` с привязкой к этому каталогу
- всем пользователям без `team_id` назначается `Default Team`

После init создайте администратора: `http://localhost:3000/api/createAdmin`

## Миграция существующей БД

Если приложение уже работало, выполните миграции **по порядку** — только те, которых ещё нет в вашей БД.

### Базовый набор (этап 1 — матрица компетенций)

Для БД с таблицами `users` и `points`, но без матрицы:

```bash
cd api

psql -U grow_app -d growdb -f src/config/migrations/001_add_competency_enums.sql
psql -U grow_app -d growdb -f src/config/migrations/002_add_teams_and_catalog.sql
psql -U grow_app -d growdb -f src/config/migrations/003_add_assessments.sql
psql -U grow_app -d growdb -f src/config/migrations/004_alter_users_team_grade.sql
psql -U grow_app -d growdb -f src/config/migrations/005_alter_points_competency_id.sql

npm run seed              # каталог + команда (идемпотентно)
npm run migrate:users     # назначить team_id пользователям без команды
```

> **Примечание:** шаг `006_assign_users_to_default_team.sql` дублирует `npm run migrate:users`. Используйте один из вариантов.

### Отвязка каталога от команды

Если миграции 001–006 уже применены и каталоги ещё привязаны к командам через `competency_catalogs.team_id`:

```bash
psql -U grow_app -d growdb -f src/config/migrations/007_decouple_catalog_from_team.sql
```

Миграция переносит активный каталог каждой команды в `teams.catalog_id` и удаляет колонки `team_id`, `is_active` из `competency_catalogs`.

### Роль lead и управляемые команды

```bash
psql -U grow_app -d growdb -f src/config/migrations/008_add_lead_role_and_managed_teams.sql
```

Добавляет значение `lead` в enum `user_role`, колонку `users.job_title` и таблицу `user_managed_teams`.

### Полная цепочка (с нуля до актуальной схемы)

```bash
cd api

psql -U grow_app -d growdb -f src/config/migrations/001_add_competency_enums.sql
psql -U grow_app -d growdb -f src/config/migrations/002_add_teams_and_catalog.sql
psql -U grow_app -d growdb -f src/config/migrations/003_add_assessments.sql
psql -U grow_app -d growdb -f src/config/migrations/004_alter_users_team_grade.sql
psql -U grow_app -d growdb -f src/config/migrations/005_alter_points_competency_id.sql
psql -U grow_app -d growdb -f src/config/migrations/007_decouple_catalog_from_team.sql
psql -U grow_app -d growdb -f src/config/migrations/008_add_lead_role_and_managed_teams.sql

npm run seed
npm run migrate:users
```

## Файлы миграций

| Файл | Содержание |
|------|------------|
| `001_add_competency_enums.sql` | типы `user_grade`, `cycle_status` |
| `002_add_teams_and_catalog.sql` | teams, catalog, blocks, domains, competencies, grade_targets |
| `003_add_assessments.sql` | assessment_cycles, competency_assessments, cycle_user_snapshots |
| `004_alter_users_team_grade.sql` | колонки `users.team_id`, `users.grade` |
| `005_alter_points_competency_id.sql` | колонка `points.competency_id` (связь с ИПР) |
| `006_assign_users_to_default_team.sql` | SQL-назначение пользователей в Default Team |
| `007_decouple_catalog_from_team.sql` | `teams.catalog_id`; удаление `team_id`/`is_active` из каталогов |
| `008_add_lead_role_and_managed_teams.sql` | роль `lead`, `users.job_title`, таблица `user_managed_teams` |

## npm-скрипты

| Команда | Описание |
|---------|----------|
| `npm run init` | Создание всей схемы с нуля (`init.sql`) |
| `npm run seed` | Seed каталога, привязка к Default Team, назначение пользователей |
| `npm run migrate:users` | Только назначение пользователей без `team_id` |
| `npm run verify:competency` | Проверка агрегатов, RBAC (admin/lead), API-скоупа |
| `npm run verify:catalog` | Проверка модели отвязанных каталогов |
| `npm test` | `verify:competency` + `verify:catalog` |

## Проверка

```sql
-- команды и привязка к каталогу
SELECT t.name, t.catalog_id, c.name AS catalog_name
FROM teams t
LEFT JOIN competency_catalogs c ON c.id = t.catalog_id;

-- каталог не привязан к команде напрямую
SELECT column_name FROM information_schema.columns
WHERE table_name = 'competency_catalogs' AND column_name IN ('team_id', 'is_active');
-- ожидается 0 строк

SELECT COUNT(*) FROM competencies;  -- ожидается 29 (после seed)

-- пользователи
SELECT login, role, team_id, grade, job_title FROM users;

-- lead и управляемые команды
SELECT u.login, u.role, t.name AS managed_team
FROM user_managed_teams umt
JOIN users u ON u.id = umt.user_id
JOIN teams t ON t.id = umt.team_id;
```

Автоматическая проверка:

```bash
cd api
npm test
```

## Откат

Миграции additive — старые таблицы не ломаются. Для отката потребуется ручное удаление новых таблиц, колонок и значений enum (не автоматизировано).

При откате `007` потребуется восстановить `competency_catalogs.team_id` и `is_active` вручную — данные о привязке хранятся в `teams.catalog_id`.
