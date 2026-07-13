## 1. Database migration

- [x] 1.1 Создать миграцию `007_decouple_catalog_from_team.sql`: добавить `teams.catalog_id`, перенести активные привязки, убрать `team_id`/`is_active` из `competency_catalogs`
- [x] 1.2 Обновить `init.sql` под новую схему (без `team_id`/`is_active` на каталогах, с `catalog_id` на teams)
- [x] 1.3 Обновить `competencyCatalogSeed.js` и `seed.js`: создавать каталог независимо, привязывать к default team

## 2. API — каталоги

- [x] 2.1 Добавить `getAllCatalogs`, `updateCatalog`, `getFullCatalogByCatalogId` (уже есть) в `competencyCatalogService`
- [x] 2.2 Переписать `getFullCatalogByTeamId` — резолвить через `teams.catalog_id`
- [x] 2.3 Переписать `cloneCatalog` на `cloneCatalogById(source_catalog_id, name)` без участия команд
- [x] 2.4 Добавить эндпоинты: `GET/POST /api/catalogs`, `GET/PATCH/DELETE /api/catalogs/:id`, `POST /api/catalogs/:id/clone`
- [x] 2.5 Удалить `POST /api/teams/:teamId/catalogs` и team-based clone endpoint
- [x] 2.6 Обновить `competencyCatalogController` и маршруты

## 3. API — команды и циклы

- [x] 3.1 Расширить `teamService.getAllTeams` — JOIN с каталогом (`catalog_id`, `catalog_name`)
- [x] 3.2 Расширить `updateTeam` — принимать `catalog_id` (nullable)
- [x] 3.3 Обновить `validateCatalogForTeam` в `assessmentCycleService` — проверка через `teams.catalog_id`
- [x] 3.4 При создании цикла автоматически подставлять `catalog_id` из команды

## 4. UI — типы и API-клиент

- [x] 4.1 Обновить `ICompetencyCatalog` (убрать `team_id`, `is_active`), `ITeam` (добавить `catalog_id`, `catalog_name`)
- [x] 4.2 Обновить `competency-catalog-api.ts`: `fetchCatalogs`, `fetchCatalog`, `createCatalog`, `updateCatalog`, `cloneCatalogById`
- [x] 4.3 Обновить `teams-api.ts`: PATCH с `catalog_id`

## 5. UI — каталог компетенций

- [x] 5.1 Переписать `use-competency-catalog.ts`: селектор каталога вместо команды
- [x] 5.2 Обновить `CatalogToolbar` — список каталогов, создать/дублировать/удалить
- [x] 5.3 Обновить `CatalogModals` — убрать clone-by-team, добавить duplicate catalog
- [x] 5.4 Обновить `CatalogEmptyState` — создание каталога без привязки к команде

## 6. UI — команды

- [x] 6.1 Добавить Select каталога в teams management UI
- [x] 6.2 Показать привязанный каталог в списке команд

## 7. Прочее

- [x] 7.1 Обновить `verify-competency-matrix.js` под новую схему
- [x] 7.2 Проверить матрицу (`use-competency-matrix.ts`) — загрузка через team catalog endpoint
- [x] 7.3 Ручная проверка: создать каталог → привязать к команде → создать цикл → оценить → сменить каталог
