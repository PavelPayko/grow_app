# База данных — матрица компетенций (этап 1)

Инструкция по развёртыванию схемы БД для change `add-competency-matrix` (задачи 1.1–1.7).

## Предварительные требования

- PostgreSQL
- База `growdb`, пользователь `grow_app` (см. [INSTALL.md](../INSTALL.md))
- Файл `api/.env` с параметрами подключения (как в `db.js`)

## С чистой БД

Подходит для новой установки, когда таблиц ещё нет.

```bash
cd api
npm install
npm run init    # полная схема из init.sql (users, points, teams, catalog, assessments)
npm run seed    # команда Default Team + каталог компетенций + назначение пользователей
```

**Что создаёт `seed`:**
- команда `Default Team`
- каталог `Competency Matrix` (29 компетенций, 5 блоков, grade targets)
- всем пользователям без `team_id` назначается `Default Team`

После init создайте администратора: `http://localhost:3000/api/createAdmin`

## Миграция существующей БД

Если приложение уже работало (есть `users`, `points`), выполните миграции **по порядку**:

```bash
cd api

psql -U grow_app -d growdb -f src/config/migrations/001_add_competency_enums.sql
psql -U grow_app -d growdb -f src/config/migrations/002_add_teams_and_catalog.sql
psql -U grow_app -d growdb -f src/config/migrations/003_add_assessments.sql
psql -U grow_app -d growdb -f src/config/migrations/004_alter_users_team_grade.sql
psql -U grow_app -d growdb -f src/config/migrations/004_alter_users_team_grade.sql

npm run seed              # команда + каталог (идемпотентно — пропустит, если команда уже есть)
npm run migrate:users     # назначить team_id пользователям без команды
```

> **Примечание:** шаг `006_assign_users_to_default_team.sql` дублирует `npm run migrate:users`. Используйте один из вариантов.

### Файлы миграций

| Файл | Содержание |
|------|------------|
| `001_add_competency_enums.sql` | типы `user_grade`, `cycle_status` |
| `002_add_teams_and_catalog.sql` | teams, catalog, blocks, domains, competencies, grade_targets |
| `003_add_assessments.sql` | assessment_cycles, competency_assessments, cycle_user_snapshots |
| `004_alter_users_team_grade.sql` | колонки `users.team_id`, `users.grade` |
| `005_alter_points_competency_id.sql` | колонка `points.competency_id` (задел под ИПР) |
| `006_assign_users_to_default_team.sql` | SQL-назначение пользователей в Default Team |

## npm-скрипты

| Команда | Описание |
|---------|----------|
| `npm run init` | Создание всей схемы с нуля (`init.sql`) |
| `npm run seed` | Seed каталога + назначение пользователей в Default Team |
| `npm run migrate:users` | Только назначение пользователей без team_id |

## Проверка

```sql
-- команда и каталог
SELECT * FROM teams;
SELECT COUNT(*) FROM competencies;  -- ожидается 29

-- пользователи привязаны к команде
SELECT login, team_id, grade FROM users;
```

## Откат (только новые объекты)

Миграции additive — старые таблицы не ломаются. Для отката этапа 1 потребуется ручное удаление новых таблиц и колонок (не автоматизировано).
