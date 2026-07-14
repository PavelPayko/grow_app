## Why

Матрица компетенций уже работает (оценки, циклы, агрегаты), но insights спрятаны в построчной таблице, а дашборды показывают только цели ИПР. Admin и будущие лиды не видят состояние команды целиком; сотрудники не получают наглядную картину своего роста по компетенциям. Параллельно RBAC ограничен ролями `user | admin`, хотя бизнес-процесс требует делегирования оценки и просмотра команд лидам — в том числе руководителям подразделений с несколькими командами.

## What Changes

- Добавить роль **`lead`** с независимым scope управления через `user_managed_teams` (0..N команд); `users.team_id` (членство) и managed teams не связаны constraint'ом
- Расширить RBAC: `canAccessTeam`, `canViewUser`, `canAssess`, `canViewAssessment` с учётом managed teams; JWT/`auth_me` возвращает `managed_team_ids`
- Добавить **дашборд команды** (приоритет 1): заменяет `MainDashboard` на вкладке «Дашборд» для admin/lead без выбранного сотрудника; heatmap, прогресс цикла, таблица команды
- Добавить **селектор команды** в сайдбаре: admin видит все команды; lead — только managed; скрыт при одной доступной команде
- Добавить **дашборд сотрудника** с секциями ИПР + компетенции; при просмотре admin/lead — дополнительные admin-блоки (дельта циклов, target summary)
- Добавить **организационный дашборд** admin-only: вкладка «Итоги» в `/admin` — статус циклов по всем командам, drill-down в дашборд команды
- Урезанная `/admin` для lead: только вкладка «Циклы оценки» в scope managed teams
- Точки входа «Мой профиль» для lead с `team_id` вне managed teams или без членства в операционной команде
- Добавить поле **`job_title`** (должность) — свободный текст для обозначения позиции сотрудника в компании, независимо от системной роли `lead`

## Capabilities

### New Capabilities

- `lead-role`: роль lead, таблица `user_managed_teams`, scope-based RBAC, назначение managed teams в admin UI
- `team-dashboard`: дашборд команды на главной для admin/lead — агрегаты, heatmap, прогресс цикла
- `employee-competency-dashboard`: обогащённый дашборд сотрудника (ИПР + компетенции + admin/lead insight blocks)
- `org-dashboard`: организационный дашборд admin в `/admin` — сводка по командам и циклам

### Modified Capabilities

- `user-management`: роль `lead` в enum; `job_title` в CRUD; managed teams в CRUD; `auth_me` с `managed_team_ids`; фильтрация списка пользователей по scope
- `teams`: listing API с фильтром по scope для lead; team selector contract
- `competency-assessment`: team aggregates API с проверкой scope; lead доступ к циклам managed teams
- `competency-matrix-ui`: `canViewAssessment` для lead; навигация с селектором команд

## Impact

- **Database**: миграция `user_role` + `lead`; `users.job_title TEXT NULL`; новая таблица `user_managed_teams(user_id, team_id)`
- **API**: middleware `canAccessTeam`, обновление `canAssess`/`canViewAssessment`; scope на `GET /users`, `GET /teams`, `GET /cycles/:id/aggregates`; возможно `GET /admin/org-summary`
- **UI**: `MainComponent` три ветки (user / lead / admin); team selector в сайдбаре; новые dashboard-компоненты; урезанный admin panel для lead; `IUserRole` расширение
- **Non-goals (MVP)**: lead не редактирует пользователей/грейды; организационный и employee dashboards — после team dashboard
