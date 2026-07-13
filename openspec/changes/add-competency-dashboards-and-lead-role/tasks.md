## 1. Database and role foundation

- [ ] 1.1 Add SQL migration: `lead` value in `user_role` enum, `users.job_title TEXT NULL`, and `user_managed_teams(user_id, team_id)` table
- [ ] 1.2 Create `managedTeamsService.js` — get/set/replace managed teams for a user
- [ ] 1.3 Update user create/update to accept `job_title` and `managed_team_ids`; sync `user_managed_teams` when role is lead
- [ ] 1.4 Update `auth_me` and JWT payload to include `managed_team_ids` for lead users

## 2. RBAC middleware and API scope

- [ ] 2.1 Refactor `canAssess.js`: rename `team_lead` → `lead`; add `managesTeam`, `canAccessTeam`, `canViewUser`; extend `canViewAssessment` for lead
- [ ] 2.2 Add middleware `requireCanAccessTeam`, `requireAdminOrLead`; apply scope checks on team aggregates, cycles, and matrix endpoints
- [ ] 2.3 Filter `GET /api/users` by scope (admin: all, lead: managed teams members, user: self)
- [ ] 2.4 Filter `GET /api/teams` by scope (admin: all, lead: managed only)
- [ ] 2.5 Allow lead to create/activate/close cycles for managed teams only
- [ ] 2.6 Add `GET /api/users/:userId/cycle-history` for dashboard trend data
- [ ] 2.7 Add `GET /api/admin/org-summary` (admin only) for organizational dashboard
- [ ] 2.8 Update `verify-competency-matrix.js` or add script to verify lead scope and canAssess rules

## 3. UI types and user management

- [ ] 3.1 Extend `IUserRole` with `lead`; add `job_title` and `managed_team_ids` to user types and auth state
- [ ] 3.2 Create `useCurrentUser` hook with `isAdmin`, `isLead`, `managedTeamIds`, `canManageTeam`
- [ ] 3.3 Add job title field («Должность») and managed teams multi-select to AddUser/UpdateUser forms
- [ ] 3.4 Update role selector to include lead option with label «Лид»

## 4. Navigation and sidebar

- [ ] 4.1 Refactor `MainComponent` into three branches: user / lead / admin
- [ ] 4.2 Add team selector to sidebar (admin: all teams; lead: managed teams when count > 1)
- [ ] 4.3 Filter sidebar employee list by selected team; show `job_title` as secondary label when set; persist `selectedTeamId` in localStorage
- [ ] 4.4 Add «Мой профиль» entry and header navigation for lead self-access
- [ ] 4.5 Show empty state when lead has no managed teams
- [ ] 4.6 Update `ContentComponent` to render TeamDashboard when no user selected (admin/lead)

## 5. Team dashboard (priority)

- [ ] 5.1 Create `team-dashboard` component module with cycle selector toolbar
- [ ] 5.2 Implement `CycleProgressCard` — avg fill_rate, fully assessed count, low-fill count
- [ ] 5.3 Implement `TeamBlockHeatmap` — members × blocks with target status colors; row click selects employee
- [ ] 5.4 Implement `TeamSummaryTable` — sortable columns: name, job_title, grade, weighted_total, fill_rate, blocks below target
- [ ] 5.5 Wire `GET /cycles/:cycleId/aggregates` with TanStack Query; replace `MainDashboard` in content area
- [ ] 5.6 Add API client functions and types for team dashboard data

## 6. Employee competency dashboard

- [ ] 6.1 Refactor `UserDashboard` into sections: IPR (existing charts) + Competencies (new)
- [ ] 6.2 Implement block vs target bar chart using active cycle aggregates
- [ ] 6.3 Implement cycle history trend chart using `cycle-history` API
- [ ] 6.4 Implement development zones list (top 5 lowest scored competencies)
- [ ] 6.5 Implement `ManagerInsightPanel` — cycle delta and target summary; visible for admin/lead only
- [ ] 6.6 Enforce 403 / hide dashboard when lead views out-of-scope user

## 7. Admin panel and org dashboard

- [ ] 7.1 Split `AdminPanelComponent` tabs by role: admin sees all; lead sees Cycles only
- [ ] 7.2 Scope `AssessmentCyclesAdmin` to `managed_team_ids` for lead
- [ ] 7.3 Show «Администрирование» menu item for lead in header
- [ ] 7.4 Create `org-dashboard` component with team cycle status table
- [ ] 7.5 Add «Итоги» tab to admin panel; wire org-summary API with drill-down to team dashboard

## 8. Matrix UI updates for lead

- [ ] 8.1 Update `use-competency-matrix` to treat lead like admin for canEdit within managed scope
- [ ] 8.2 Update matrix components to use `useCurrentUser` instead of inline `isAdmin` checks where needed

## 9. Verification

- [ ] 9.1 Manual test matrix: user / lead (1 team) / lead (N teams) / admin navigation flows
- [ ] 9.2 Verify lead cannot access other teams via API (403 on out-of-scope endpoints)
- [ ] 9.3 Verify team dashboard widgets render correctly for active cycle with partial assessments
- [ ] 9.4 Run `openspec validate add-competency-dashboards-and-lead-role --strict`
