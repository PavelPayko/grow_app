## Context

Сейчас `competency_catalogs` содержит обязательный `team_id` и флаг `is_active`; уникальный индекс гарантирует один активный каталог на команду. Создание каталога (`POST /api/teams/:teamId/catalogs`) и клонирование (`source_team_id` → `target_team_id`) работают через команды. UI каталога (`competency-catalog`) выбирает команду в toolbar и загружает каталог команды.

Циклы оценки (`assessment_cycles`) уже хранят `catalog_id` — снимок каталога на момент цикла. При активации цикла валидация проверяет принадлежность каталога команде через `competency_catalogs.team_id`.

## Goals / Non-Goals

**Goals:**
- Каталоги — независимые сущности с глобальным CRUD
- Команда ссылается на каталог через `teams.catalog_id` (nullable, изменяемый)
- Миграция существующих данных без потери структуры каталогов и оценок
- UI: управление каталогами отдельно; привязка каталога — в управлении командами
- Сохранить существующую иерархию blocks → domains → competencies и grade targets

**Non-Goals:**
- Версионирование каталогов (история изменений каталога)
- Автоматическая синхронизация оценок при смене каталога команды
- Удаление каталогов (только если не привязаны к командам и не использовались в циклах)
- Изменение логики агрегации и Excel import/export

## Decisions

### 1. Перенос привязки: `teams.catalog_id` вместо `competency_catalogs.team_id`

**Решение:** добавить `teams.catalog_id UUID REFERENCES competency_catalogs(id) ON DELETE RESTRICT`, убрать `team_id` и `is_active` из `competency_catalogs`.

**Альтернатива:** оставить `team_id` nullable на каталоге — отклонено, т.к. не позволяет нескольким командам использовать один каталог и смешивает владение с привязкой.

### 2. Миграция данных (007)

```sql
-- 1. Добавить catalog_id в teams
ALTER TABLE teams ADD COLUMN catalog_id UUID REFERENCES competency_catalogs(id);

-- 2. Проставить catalog_id из активного каталога команды
UPDATE teams t SET catalog_id = (
  SELECT id FROM competency_catalogs c
  WHERE c.team_id = t.id AND c.is_active = true LIMIT 1
);

-- 3. Удалить team_id, is_active, уникальный индекс с competency_catalogs
ALTER TABLE competency_catalogs DROP COLUMN team_id;
ALTER TABLE competency_catalogs DROP COLUMN is_active;
DROP INDEX idx_competency_catalogs_one_active_per_team;
```

Неактивные каталоги (`is_active = false`) остаются в БД как независимые записи; командам не привязываются автоматически.

### 3. API-структура

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/catalogs` | Список каталогов |
| POST | `/api/catalogs` | Создать каталог `{ name }` |
| GET | `/api/catalogs/:catalogId` | Полное дерево каталога |
| PATCH | `/api/catalogs/:catalogId` | Переименовать |
| DELETE | `/api/catalogs/:catalogId` | Удалить (если не привязан к командам и циклам) |
| POST | `/api/catalogs/:catalogId/clone` | Дублировать `{ name? }` |
| GET | `/api/teams/:teamId/catalog` | Каталог команды (через `teams.catalog_id`) — сохранить для обратной совместимости матрицы |
| PATCH | `/api/teams/:teamId` | Добавить `catalog_id` в body |

Удалить: `POST /api/teams/:teamId/catalogs`, `POST /api/catalogs/clone` (team-based clone).

CRUD блоков/доменов/компетенций остаётся на `/api/catalogs/:catalogId/blocks/...` (уже catalog-scoped).

### 4. Валидация циклов

`validateCatalogForTeam` меняется на:
```js
SELECT catalog_id FROM teams WHERE id = $team_id
-- catalog_id должен совпадать с переданным catalog_id цикла
```

При создании цикла `catalog_id` подставляется из `teams.catalog_id` автоматически (не выбирается вручную в UI).

### 5. UI-изменения

**Каталог (`competency-catalog`):**
- Toolbar: селектор каталога вместо команды
- Кнопки «Создать каталог» / «Дублировать» работают с выбранным каталогом
- Убрать clone-by-team modal

**Команды (teams tab):**
- Колонка/поле «Каталог» с Select из списка каталогов
- PATCH при изменении

**Матрица:** без изменений в загрузке — `GET /api/teams/:teamId/catalog` резолвит через `teams.catalog_id`.

### 6. Типы

```ts
interface ICompetencyCatalog {
  id: string
  name: string
  created_at: string
  // убрать team_id, is_active
}

interface ITeam {
  id: string
  name: string
  catalog_id?: string | null
  catalog_name?: string | null
}
```

## Risks / Trade-offs

- **[Смена каталога команды не обновляет активный цикл]** → Цикл хранит `catalog_id` на момент создания; смена привязки влияет только на новые циклы. Документировать в UI.
- **[Неактивные каталоги после миграции]** → Остаются в БД как «сироты»; админ может их удалить вручную позже или привязать к команде.
- **[Breaking API]** → Фронт и скрипты обновляются в том же PR; внешних потребителей нет.
- **[Shared catalog edits affect multiple teams]** → Ожидаемое поведение при переиспользовании; дублирование каталога для изоляции.

## Migration Plan

1. Добавить миграцию `007_decouple_catalog_from_team.sql`
2. Обновить `init.sql` и seed для новой схемы
3. Деплой: `npm run migrate` → обновить API → обновить UI
4. Rollback: откат миграции потребует восстановления `team_id`/`is_active` — подготовить down-скрипт, но в prod применять только после бэкапа

## Open Questions

- Показывать ли в списке каталогов количество привязанных команд? (nice-to-have для UI)
