## Context

Grow App — инструмент ИПР (цели/достижения через `points`). Команда параллельно ведёт оценку компетенций в Excel с тремя листами: ввод оценок, итоги по сотрудникам, итоги по блокам с target-диапазонами по грейдам.

Текущий стек: Express + raw PostgreSQL (api), React + Ant Design + TanStack Query (ui). Auth — JWT, роли `user | admin` через enum. Нет понятия команд, грейдов, компетенций.

Ограничения из обсуждения:
- Каталог редактируемый, разный для разных команд
- Admin оценивает в MVP; позже team_lead, pm
- Переоценки по циклам с историей
- Excel import/export желателен в MVP
- Связь с ИПР — только schema hook (`points.competency_id`)

## Goals / Non-Goals

**Goals:**
- Перенести Excel-матрицу в приложение с сохранением формул расчёта
- Мультикомандные каталоги компетенций с CRUD для admin
- Циклы оценки с историей (draft / active / closed)
- Вкладка «Матрица» с итогами, target-подсветкой по грейду
- Import/export `.xlsx` по формату шаблона
- Расширяемый RBAC через `canAssess(actor, targetUser)`

**Non-Goals:**
- UI связи компетенций с points (только nullable FK)
- Роли team_lead / pm в MVP (только задел в middleware)
- Отдельные листы «Итоги» / «Итоги по блокам» как самостоятельные страницы
- Radar chart / heatmap (можно позже на базе тех же API)

## Decisions

### 1. Грейд на `users` + snapshot в цикле

**Решение:** `users.grade` (enum: junior, middle, senior) для текущего грейда; `cycle_user_snapshots(cycle_id, user_id, grade)` при активации/закрытии цикла.

**Альтернатива:** только snapshot без колонки на users — отвергнута: нужен текущий грейд для UI и target вне контекста цикла.

### 2. Team-scoped каталог

**Решение:** `teams` → `competency_catalogs` (1 active catalog per team) → blocks → domains → competencies + grade_targets.

**Альтернатива:** один глобальный каталог — отвергнута: пользователь явно запросил разные команды.

**Клонирование:** admin может клонировать каталог другой команды как стартовую точку.

### 3. Циклы оценки вместо перезаписи

**Решение:** `assessment_cycles` + `competency_assessments(cycle_id, user_id, competency_id, score, evidence, assessed_by, assessed_at)`. UNIQUE(cycle_id, user_id, competency_id).

**Статусы цикла:** draft (редактирование структуры), active (ввод оценок), closed (read-only).

**Альтернатива:** version column на assessments — отвергнута: циклы ближе к бизнес-процессу «Q1 2026».

### 4. Формулы расчёта (server-side)

Взвешенный итог по сотруднику:
```
weighted_sum = Σ(score × weight)  // только где score IS NOT NULL
weighted_total = weighted_sum / Σ(weight)  // только по оценённым компетенциям
unweighted_avg = AVG(score)  // только не-null
fill_rate = count(scored) / count(all competencies in catalog)
```

Взвешенный итог по блоку — та же формула, фильтр по block_id.

Target-сравнение: `grade_targets(block_id, grade)` → min_score, max_score; подсветка below / in-range / above.

Расчёт на backend (service layer), UI получает готовые aggregates.

### 5. RBAC: `canAssess` middleware

**MVP:**
```javascript
canAssess(actor, targetUser):
  admin → true (any user)
  user  → false
```

**Future:** team_lead → same team; pm → configurable.

Enum `user_role` расширяется при добавлении ролей. Не вводить permissions table в MVP.

### 6. Excel: exceljs на backend

**Export:** генерировать 3 листа как в шаблоне (Оценка_сотрудников, Итоги, Итоги_по_блокам).

**Import:** парсить лист «Оценка_сотрудников» → upsert catalog items + assessments в выбранный cycle. Маппинг сотрудников по `full_name`. Конфlicts: **overwrite** оценок в выбранном cycle (admin confirm в UI).

**Альтернатива:** client-side xlsx — отвергнута: единая валидация на сервере.

### 7. UI: вкладка «Матрица» в ContentComponent

Третья вкладка рядом с «Таймлайн» и «Дашборд». Внутри:
- Cycle selector
- Collapsible table grouped by block (Ant Design Table + rowSpan или nested panels)
- Inline edit score (Select 0–3) + evidence (Input) для admin
- Summary bar: weighted total, fill %, grade, target indicators per block

Admin catalog CRUD — отдельный раздел в `/admin` или modal/drawer из матрицы (admin only).

### 8. Schema hook для ИПР

```sql
ALTER TABLE points ADD COLUMN competency_id UUID REFERENCES competencies(id) ON DELETE SET NULL;
```
Без UI в этом change.

### 9. Migration / seed

1. CREATE TYPE user_grade, extend tables
2. INSERT default team «Default»
3. UPDATE users SET team_id = default team
4. Seed catalog from Excel template (29 competencies, 5 blocks, grade targets)
5. CREATE one active assessment cycle

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Excel format drift | Strict validation on import; export always matches template structure |
| Large matrix UI performance (29 × N users) | MVP shows one user at a time; team summary as separate API call |
| Enum role extension breaks JWT | Role in JWT payload; re-login on role change (existing pattern) |
| Catalog edit mid-cycle invalidates assessments | Warn admin; block delete if assessments exist (soft: archive only) |
| Name-based import mapping fails | Fallback to login column in import UI; show unmatched report |

## Migration Plan

1. Run SQL migration (additive only, no breaking changes to existing tables)
2. Seed default team + catalog
3. Assign existing users to default team
4. Deploy API + UI
5. Admin creates first cycle or imports from Excel
6. Rollback: drop new tables/columns (no data loss on points/users core fields)

## Open Questions

1. **Закрытие цикла** — admin вручную или auto по end_date? → *Предложение: manual close + optional end_date warning*
2. **Кто редактирует каталог** — только admin или team_lead позже? → *MVP: admin only*
3. **Default team name** — «Default Team»; seed-каталог из Excel-шаблона без привязки имени команды к домену
