## 1. Database and role foundation

- [x] 1.1 Add SQL migration: `lead` value in `user_role` enum, `users.job_title TEXT NULL`, and `user_managed_teams(user_id, team_id)` table
- [x] 1.2 Create `managedTeamsService.js` — get/set/replace managed teams for a user
- [x] 1.3 Update user create/update to accept `job_title` and `managed_team_ids`; sync `user_managed_teams` when role is lead
- [x] 1.4 Update `auth_me` and JWT payload to include `managed_team_ids` for lead users

## 2. RBAC middleware and API scope

- [x] 2.1 Refactor `canAssess.js`: rename `team_lead` → `lead`; add `managesTeam`, `canAccessTeam`, `canViewUser`; extend `canViewAssessment` for lead
- [x] 2.2 Add middleware `requireCanAccessTeam`, `requireAdminOrLead`; apply scope checks on team aggregates, cycles, and matrix endpoints
- [x] 2.3 Filter `GET /api/users` by scope (admin: all, lead: managed teams members, user: self)
- [x] 2.4 Filter `GET /api/teams` by scope (admin: all, lead: managed only)
- [x] 2.5 Allow lead to create/activate/close cycles for managed teams only
- [x] 2.6 Add `GET /api/users/:userId/cycle-history` for dashboard trend data
- [x] 2.7 Add `GET /api/admin/org-summary` (admin only) for organizational dashboard
- [x] 2.8 Update `verify-competency-matrix.js` or add script to verify lead scope and canAssess rules

## 3. UI types and user management

- [x] 3.1 Extend `IUserRole` with `lead`; add `job_title` and `managed_team_ids` to user types and auth state
- [x] 3.2 Create `useCurrentUser` hook with `isAdmin`, `isLead`, `managedTeamIds`, `canManageTeam`
- [x] 3.3 Add job title field («Должность») and managed teams multi-select to AddUser/UpdateUser forms
- [x] 3.4 Update role selector to include lead option with label «Лид»

## 4. Navigation and sidebar

- [x] 4.1 Refactor `MainComponent` into three branches: user / lead / admin
- [x] 4.2 Add team selector to sidebar (admin: all teams; lead: managed teams when count > 1)
- [x] 4.3 Filter sidebar employee list by selected team; show `job_title` as secondary label when set; persist `selectedTeamId` in localStorage
- [x] 4.4 Add «Мой профиль» entry and header navigation for lead self-access
- [x] 4.5 Show empty state when lead has no managed teams
- [x] 4.6 Update `ContentComponent` to render TeamDashboard when no user selected (admin/lead)

## 5. Team dashboard (priority)

- [x] 5.1 Create `team-dashboard` component module with cycle selector toolbar
- [x] 5.2 Implement `CycleProgressCard` — avg fill_rate, fully assessed count, low-fill count
- [x] 5.3 Implement `TeamBlockHeatmap` — members × blocks with target status colors; row click selects employee
- [x] 5.4 Implement `TeamSummaryTable` — sortable columns: name, job_title, grade, weighted_total, fill_rate, blocks below target
- [x] 5.5 Wire `GET /cycles/:cycleId/aggregates` with TanStack Query; replace `MainDashboard` in content area
- [x] 5.6 Add API client functions and types for team dashboard data

## 6. Employee competency dashboard

- [x] 6.1 Refactor `UserDashboard` into sections: IPR (existing charts) + Competencies (new)
- [x] 6.2 Implement block vs target bar chart using active cycle aggregates
- [x] 6.3 Implement cycle history trend chart using `cycle-history` API
- [x] 6.4 Implement development zones list (top 5 lowest scored competencies)
- [x] 6.5 Implement `ManagerInsightPanel` — cycle delta and target summary; visible for admin/lead only
- [x] 6.6 Enforce 403 / hide dashboard when lead views out-of-scope user

## 7. Admin panel and org dashboard

- [x] 7.1 Split `AdminPanelComponent` tabs by role: admin sees all; lead sees Users, Teams, Cycles, Итоги (scoped to managed teams); catalog admin-only
- [x] 7.2 Scope admin panel data for lead: users/teams/org-summary via API scope; cycles via `managed_team_ids`; teams read-only
- [x] 7.3 Show «Администрирование» menu item for lead in header
- [x] 7.4 Create `org-dashboard` component with team cycle status table
- [x] 7.5 Add «Итоги» tab to admin panel; wire org-summary API with drill-down to team dashboard

## 8. Matrix UI updates for lead

- [x] 8.1 Update `use-competency-matrix` to treat lead like admin for canEdit within managed scope
- [x] 8.2 Update matrix components to use `useCurrentUser` instead of inline `isAdmin` checks where needed

## 9. Verification

- [x] 9.1 Manual test matrix: user / lead (1 team) / lead (N teams) / admin navigation flows
- [x] 9.2 Verify lead cannot access other teams via API (403 on out-of-scope endpoints)
- [x] 9.3 Verify team dashboard widgets render correctly for active cycle with partial assessments
- [x] 9.4 Run `openspec validate add-competency-dashboards-and-lead-role --strict`
