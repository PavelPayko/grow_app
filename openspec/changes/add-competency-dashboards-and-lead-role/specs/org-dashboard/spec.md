## ADDED Requirements

### Requirement: Organizational dashboard in admin panel
The system SHALL provide an "Итоги" tab in the admin panel showing organization-wide assessment status across all teams; this tab SHALL be visible only to users with role admin.

#### Scenario: Admin sees org dashboard tab
- **WHEN** an admin opens /admin
- **THEN** an "Итоги" tab is available alongside Users, Teams, Catalog, and Cycles

#### Scenario: Lead does not see org dashboard
- **WHEN** a lead opens /admin
- **THEN** the "Итоги" tab is not shown

### Requirement: Team cycle status table
The organizational dashboard SHALL display a table with one row per team showing: team name, active or latest cycle name, cycle status, and team average fill_rate when a cycle exists.

#### Scenario: Team without cycle
- **WHEN** a team has no assessment cycles
- **THEN** the row shows no cycle with status indicating not started

#### Scenario: Team with active cycle
- **WHEN** a team has an active cycle at 78% average fill_rate
- **THEN** the row shows the cycle name, status active, and fill_rate 78%

### Requirement: Drill-down to team dashboard
The organizational dashboard SHALL allow clicking a team row to navigate to the main view with that team selected and the team dashboard displayed.

#### Scenario: Admin drills down to team
- **WHEN** an admin clicks a team row in the org dashboard
- **THEN** the application navigates to / with that team pre-selected in the sidebar and team dashboard visible

### Requirement: Org summary API
The system SHALL provide GET /api/admin/org-summary (admin only) returning per-team cycle status and aggregate fill_rate for the active or most recent cycle.

#### Scenario: Admin fetches org summary
- **WHEN** an admin requests GET /api/admin/org-summary
- **THEN** the response includes all teams with cycle and fill_rate summary

#### Scenario: Non-admin denied org summary
- **WHEN** a lead or user requests GET /api/admin/org-summary
- **THEN** the system returns 403 Forbidden
