## 1. Database schema and migration

- [x] 1.1 Add SQL types: user_grade enum, cycle_status enum
- [x] 1.2 Create teams table and competency catalog tables (catalogs, blocks, domains, competencies, grade_targets)
- [x] 1.3 Create assessment tables (assessment_cycles, competency_assessments, cycle_user_snapshots)
- [x] 1.4 ALTER users: add team_id (FK), grade (user_grade, default junior)
- [x] 1.5 ALTER points: add nullable competency_id (FK, ON DELETE SET NULL)
- [x] 1.6 Write seed script: default team, catalog from Excel template (29 competencies, 5 blocks, grade targets)
- [x] 1.7 Write migration script: assign existing users to default team

## 2. Backend — teams and user extensions

- [x] 2.1 Implement teamService (CRUD, list)
- [x] 2.2 Add team routes and controller (GET/POST /api/teams)
- [x] 2.3 Extend userService and userController for team_id and grade fields
- [x] 2.4 Update user API types and validation

## 3. Backend — competency catalog

- [x] 3.1 Implement competencyCatalogService (blocks, domains, competencies, grade_targets CRUD)
- [x] 3.2 Implement catalog clone endpoint
- [x] 3.3 Add catalog routes and controller with admin guard
- [x] 3.4 Add delete protection for competencies with existing assessments

## 4. Backend — assessment cycles and scoring

- [x] 4.1 Implement assessmentCycleService (create, activate, close, list by team)
- [x] 4.2 Implement grade snapshot on cycle activation
- [x] 4.3 Implement competencyAssessmentService (upsert score + evidence)
- [x] 4.4 Implement aggregate calculation service (weighted total, block totals, fill rate, target comparison)
- [x] 4.5 Add assessment routes and controller
- [x] 4.6 Implement canAssess middleware (admin only in MVP)

## 5. Backend — Excel import/export

- [x] 5.1 Add exceljs dependency to api/package.json
- [x] 5.2 Implement export service: generate 3-sheet xlsx (Оценка_сотрудников, Итоги, Итоги_по_блокам)
- [x] 5.3 Implement import service: parse xlsx, match employees by full_name, upsert assessments
- [x] 5.4 Implement catalog import from Оценка_сотрудников sheet rows
- [x] 5.5 Add import/export routes (multipart upload, file download) with admin guard
- [x] 5.6 Return unmatched employee report on import

## 6. Frontend — API layer and types

- [x] 6.1 Add TypeScript types: Team, CompetencyBlock, Competency, AssessmentCycle, Assessment, Aggregates
- [x] 6.2 Create teams-api.ts, competency-catalog-api.ts, competency-assessment-api.ts
- [x] 6.3 Extend users-api.ts and user types for team_id and grade

## 7. Frontend — admin user and catalog UI

- [x] 7.1 Add grade and team selectors to AddUser and UpdateUser forms
- [x] 7.2 Create CompetencyCatalog admin component (blocks/domains/competencies CRUD)
- [x] 7.3 Add catalog clone action
- [x] 7.4 Add grade targets editor per block
- [x] 7.5 Add Teams admin tab with create team UI

## 8. Frontend — matrix tab

- [x] 8.1 Create CompetencyMatrix component with cycle selector
- [x] 8.2 Implement block-grouped table (domain, competency, weight, criterion, score, evidence)
- [x] 8.3 Add summary bar (grade, weighted total, fill rate)
- [x] 8.4 Add block-level summary with target status indicators (below / in-range / above)
- [x] 8.5 Implement inline score/evidence editing for admin on active cycles
- [x] 8.6 Add read-only mode for users and closed cycles
- [x] 8.7 Add "Матрица" tab to ContentComponent
- [x] 8.8 Add Assessment cycles admin tab (create, activate, close)

## 9. Frontend — Excel import/export UI

- [x] 9.1 Add Export xlsx button on matrix view (admin only)
- [x] 9.2 Add Import xlsx upload with team/cycle selection and overwrite confirmation
- [x] 9.3 Display import result report (matched/unmatched/errors)

## 10. Integration and verification

- [x] 10.1 Verify aggregate calculations match Excel template formulas for sample data
- [x] 10.2 Verify export → edit in Excel → import roundtrip
- [x] 10.3 Verify closed cycle immutability and historical cycle access
- [x] 10.4 Verify RBAC: admin edit, user read-only, non-admin denied import/export
