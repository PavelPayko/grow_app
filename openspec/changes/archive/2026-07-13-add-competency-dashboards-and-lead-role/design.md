## Context

Grow App имеет работающую матрицу компетенций (каталог, циклы, оценки, агрегаты, вкладка «Матрица»), но дашборды показывают только ИПР (points). RBAC — `user | admin`; в `canAssess.js` уже есть заготовка `team_lead`, но enum в БД и middleware `isAdmin` не поддерживают делегирование.

Текущая навигация:
- **user** → `Content` со своим профилем (Таймлайн / Дашборд / Матрица)
- **admin** → сайдбар «Все пользователи» + список; `MainDashboard` — legacy bar chart по points

API `GET /cycles/:cycleId/aggregates` уже возвращает `ITeamAggregateUser[]` — основа для дашборда команды.

## Goals / Non-Goals

**Goals:**
- Роль `lead` с независимым scope через `user_managed_teams` (0..N команд)
- Три дашборда: команды (приоритет), сотрудника (ИПР + компетенции + insight blocks), организационный (admin-only)
- Селектор команд в сайдбаре для admin и lead с N командами
- Урезанный `/admin` для lead (только циклы)
- Scope-based RBAC на API и UI

**Non-Goals:**
- Lead редактирует пользователей, грейды, каталог (остаётся admin; задел в RBAC)
- Radar chart как отдельный тип — bar chart по блокам достаточен для MVP
- Связь points ↔ competency на дашборде (competency_id без UI)
- Роль `pm` (оставить hook в canAssessByRole)

## Decisions

### 1. Роль `lead` (не `team_lead`)

**Решение:** enum value `lead`; переименовать `team_lead` → `lead` в `canAssess.js`.

**Альтернатива:** `team_lead` — отвергнута: при multi-team звучит узко.

### 2. Независимые membership и management scope

**Решение:**
- `users.team_id` — членство (nullable), влияет на свою матрицу/ИПР
- `user_managed_teams(user_id, team_id)` — scope лида, без FK constraint «lead ∈ managed»

**Альтернатива:** lead обязан состоять в managed team — отвергнута: нужна гибкость для руководителей подразделений.

### 3. RBAC: scope helpers вместо расширения isAdmin

**Решение:** новые функции в `canAssess.js` (или `accessControl.js`):

```javascript
managesTeam(actor, teamId)   // admin → true; lead → teamId ∈ managed
canAccessTeam(actor, teamId)
canViewUser(actor, targetUserId)  // admin | self | lead+same team membership of target
canAssess(actor, targetUserId)    // существующая логика + lead
canViewAssessment(actor, targetUserId)  // расширить для lead
```

Middleware:
- `requireCanAccessTeam` — для team-scoped endpoints
- `requireAdmin` — для org-summary, user CRUD, catalog
- `requireAdminOrLead` — для cycles (lead scoped)

**Альтернатива:** один `isManager` middleware — отвергнута: admin и lead имеют разный scope.

### 4. JWT и auth_me

**Решение:** при логине и `auth_me` для lead подгружать `managed_team_ids[]` из `user_managed_teams`. UI хранит в state/localStorage вместе с user.

**Альтернатива:** отдельный `GET /api/me/managed-teams` — отвергнута: лишний round-trip.

### 5. Навигация MainComponent — три ветки

```
role === 'user'   → Content(self), без сайдбара
role === 'lead'   → Layout + sidebar (team selector + members + «Мой профиль») + Content
role === 'admin'  → Layout + sidebar (team selector + members) + Content
```

Селектор команд:
- Показывать если `admin` OR `managed_team_ids.length > 1`
- Admin: все команды; Lead: только managed
- Выбранная команда → `localStorage` key `selectedTeamId`

Сайдбар без «Все пользователи» для lead; для admin — опционально «Все команды» как placeholder или скрыть до выбора команды.

### 6. ContentComponent — маршрутизация вкладок

| activeUser | role | вкладка «Дашборд» |
|------------|------|-------------------|
| null | admin/lead | `TeamDashboard` |
| userId | any with access | `EmployeeDashboard` (+ insight if admin/lead) |
| null | user | N/A (always has self) |

### 7. Team dashboard — компоненты и данные

**Решение:** новый `team-dashboard/`:
- `TeamDashboardToolbar` — team + cycle selectors
- `CycleProgressCard` — avg fill_rate, fully assessed count, low fill count
- `TeamBlockHeatmap` — ECharts heatmap или Ant Design Table с цветными ячейками
- `TeamSummaryTable` — sortable, клик → setActiveUser

Данные: `GET /cycles/:cycleId/aggregates` (уже есть) + `GET /teams/:teamId/cycles` для селектора.

### 8. Employee dashboard — гибрид A+B

**Решение:** рефактор `UserDashboard`:
- Секция IPR — существующие charts без изменений
- Секция Competencies — block bar chart, cycle trend, development zones
- `ManagerInsightPanel` — рендер если `role === 'admin' || role === 'lead'` && viewing other user (or self for lead's own 1:1 prep — показывать и для self при lead/admin)

Новый API: `GET /users/:userId/cycle-history` — массив `{ cycle_id, cycle_name, weighted_total, fill_rate, blocks[] }`.

### 9. Org dashboard

**Решение:** вкладка в `AdminPanelComponent`; новый `GET /api/admin/org-summary`:

```json
[
  { "team_id", "team_name", "cycle_id", "cycle_name", "cycle_status", "avg_fill_rate", "member_count" }
]
```

Drill-down: `navigate('/')` + set `selectedTeamId` в state/context.

### 10. Admin panel для lead

**Решение:** `AdminPanelComponent` проверяет role:
- `admin` → все вкладки
- `lead` → только `AssessmentCyclesAdmin` с prop `teamIds={managed_team_ids}`

Header: пункт «Администрирование» виден и для lead.

### 11. User CRUD — managed teams and job_title

**Решение:** в `UpdateUser` / `AddUser`:
- `Input` «Должность» (`job_title`) — для всех ролей, optional, max ~150 символов
- `Select mode="multiple"` для managed teams — visible when `role === 'lead'`

API `PUT /users/:id` принимает `job_title` (string | null) и `managed_team_ids: string[]`.

**Отличие от role:** `role = lead` — права в системе; `job_title = "Руководитель направления"` — подпись в UI.

### 12. Миграция БД

```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lead';

ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title TEXT;

CREATE TABLE user_managed_teams (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, team_id)
);
```

Переименование `team_lead` в коде — не в данных (enum value новый `lead`).

### 13. Фазы реализации

1. **Phase 0:** RBAC + lead role + sidebar + scoped APIs
2. **Phase 1:** Team dashboard (приоритет)
3. **Phase 2:** Employee dashboard A+B
4. **Phase 3:** Org dashboard

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| JWT stale после смены managed_teams | Re-login on role/scope change (существующий паттерн) |
| Heatmap performance при больших командах | MVP: table с цветными tags; ECharts heatmap до ~30 строк |
| Lead без managed teams — пустой UI | Empty state с сообщением |
| Дублирование isAdmin checks в UI | Хук `useCurrentUser()` с `isAdmin`, `isLead`, `managedTeamIds` |
| GET /users для lead фильтрует на backend | Не полагаться на frontend filter |
| Сравнение команд в org dashboard при разных каталогах | Показывать fill_rate, не weighted_total cross-team |

## Migration Plan

1. SQL migration: `lead` enum + `job_title` column + `user_managed_teams`
2. Deploy API с новыми middleware (backward compatible: нет lead users до назначения)
3. Deploy UI с тремя ветками навигации
4. Admin назначает первых lead users через Users tab
5. Rollback: drop `user_managed_teams`; lead users revert to user role manually

## Open Questions

1. Admin sidebar: сохранять пункт «Все пользователи» или требовать выбор команды? → **Предложение:** убрать «Все», default — первая команда; org view в /admin
2. Insight blocks на своём профиле lead — показывать? → **Да**, полезно для self-review
