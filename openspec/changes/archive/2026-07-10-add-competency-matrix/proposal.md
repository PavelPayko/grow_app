## Why

Grow App сегодня отслеживает индивидуальные планы развития (цели и достижения), но не фиксирует уровень компетенций сотрудников. Команда уже ведёт оценку в Excel-матрице с взвешенными баллами, блоками компетенций и target-диапазонами по грейдам — этот процесс нужно перенести в приложение, чтобы централизовать данные, поддержать разные команды и переоценки по циклам.

## What Changes

- Добавить мультикомандную модель: команды, каталоги компетенций (блок → домен → компетенция + вес + критерий)
- Добавить грейды сотрудников (Junior / Middle / Senior) и target-диапазоны по блокам
- Добавить циклы оценки с историей переоценок (draft / active / closed)
- Добавить оценки компетенций: балл 0–3, доказательства, assessed_by
- Добавить вкладку «Матрица» в UI с группировкой по блокам, итогами и target-подсветкой
- Добавить CRUD каталога компетенций для admin (редактируемый, per-team)
- Добавить import/export Excel по формату существующего шаблона
- Расширить RBAC: admin оценивает в MVP; заложить `canAssess` для будущих ролей (team_lead, pm)
- Заложить nullable `competency_id` в `points` для будущей связи с ИПР (без UI в этом change)
- Seed default-каталог из шаблона «Матрица_оценки_компетенций.xlsx» для команды по умолчанию

## Capabilities

### New Capabilities

- `teams`: управление командами, привязка пользователей к команде
- `competency-catalog`: редактируемый каталог компетенций (блоки, домены, компетенции, веса, критерии, grade targets) per-team
- `competency-assessment`: циклы оценки, выставление баллов, расчёт итогов, история переоценок
- `competency-matrix-ui`: вкладка «Матрица» — просмотр/редактирование оценок, итоги, target-подсветка
- `competency-excel`: import/export `.xlsx` по формату шаблона

### Modified Capabilities

- `user-management`: добавление полей `team_id` и `grade`; расширение RBAC для оценки компетенций

## Impact

- **Database**: новые таблицы (teams, competency_catalogs, blocks, domains, competencies, grade_targets, assessment_cycles, competency_assessments, cycle_user_snapshots); ALTER users (team_id, grade); ALTER points (competency_id nullable)
- **API**: новые endpoints для teams, catalog CRUD, cycles, assessments, import/export; middleware `canAssess`
- **UI**: новая вкладка «Матрица», admin UI для каталога, селектор цикла, import/export кнопки
- **Dependencies**: exceljs (или аналог) на backend для xlsx
- **Migration**: существующие users → default team; seed каталог из Excel-шаблона
