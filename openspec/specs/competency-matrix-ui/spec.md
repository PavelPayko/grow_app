# competency-matrix-ui Specification

## Purpose
TBD - created by archiving change add-competency-matrix. Update Purpose after archive.
## Requirements
### Requirement: Team selector drives matrix and dashboard context
When an admin or lead selects a team in the sidebar, the employee list and default team dashboard context SHALL update to that team.

#### Scenario: Sidebar team change updates employee list
- **WHEN** an admin changes the sidebar team selector from Backend to Frontend
- **THEN** the employee list shows Frontend members only

### Requirement: Lead matrix view for team members
Leads SHALL be able to view and edit (when canAssess applies) the matrix for users in managed teams following the same UI as admin.

#### Scenario: Lead views team member matrix
- **WHEN** a lead selects an employee from a managed team and opens the Matrix tab
- **THEN** the competency matrix loads for that employee

#### Scenario: Lead edits assessment in active cycle
- **WHEN** a lead changes a score for a managed team member in an active cycle
- **THEN** the assessment is saved and aggregates update

### Requirement: Matrix tab in user content area
The system SHALL display a "Матрица" tab alongside "Таймлайн" and "Дашборд" when viewing a specific user; leads with access to the user via canViewUser SHALL also see the tab.

#### Scenario: Tab visible for selected user
- **WHEN** an admin or lead views an employee profile in the main content area
- **THEN** a "Матрица" tab is available

#### Scenario: Tab visible for self
- **WHEN** a user or lead views their own profile
- **THEN** a "Матрица" tab is available when team_id and catalog are configured

#### Scenario: Tab hidden in team dashboard view
- **WHEN** no specific user is selected (team dashboard view)
- **THEN** the matrix tab is not shown

### Requirement: Cycle selector
The matrix view SHALL include a dropdown to select an assessment cycle.

#### Scenario: Default active cycle
- **WHEN** the matrix tab opens
- **THEN** the active cycle for the user's team is selected by default

#### Scenario: Switch to historical cycle
- **WHEN** a user selects a closed cycle from the dropdown
- **THEN** assessments display in read-only mode

### Requirement: Competency table grouped by block
The matrix view SHALL display competencies grouped by block with columns: domain, competency name, weight, criterion, score, evidence.

#### Scenario: Block grouping
- **WHEN** the matrix renders
- **THEN** competencies are visually grouped under their block headers with block-level summary

#### Scenario: Block summary shows target status
- **WHEN** a block has a calculated weighted total
- **THEN** the block header shows the total and target status indicator (below / in-range / above)

### Requirement: Summary bar
The matrix view SHALL show a summary bar with: user grade, weighted total (0–3), fill rate percentage.

#### Scenario: Summary updates on score change
- **WHEN** an admin changes a score
- **THEN** the summary bar recalculates without full page reload

### Requirement: Admin inline editing
The system SHALL allow users with canAssess to edit score (0–3 select) and evidence (text input) inline when viewing an active cycle.

#### Scenario: Admin edits score
- **WHEN** an admin selects score 3 for a competency in an active cycle
- **THEN** the assessment is saved and aggregates update

#### Scenario: Lead edits score
- **WHEN** a lead with canAssess selects score 2 for a managed team member in an active cycle
- **THEN** the assessment is saved and aggregates update

#### Scenario: User read-only view
- **WHEN** a regular user views their own matrix
- **THEN** score and evidence fields are read-only

#### Scenario: Closed cycle read-only for all
- **WHEN** viewing a closed cycle
- **THEN** no editing controls are shown regardless of role

### Requirement: Admin catalog management entry point
The system SHALL provide admin access to catalog CRUD from the admin area, managing catalogs independently of teams.

#### Scenario: Admin opens catalog editor
- **WHEN** an admin navigates to catalog management and selects a catalog
- **THEN** they can manage blocks, domains, competencies, and grade targets for that catalog

#### Scenario: Admin views team-linked catalog from matrix context
- **WHEN** an admin views the matrix for a user whose team has an assigned catalog
- **THEN** the matrix loads competencies from the team's assigned catalog

#### Scenario: Matrix empty state without team catalog
- **WHEN** an admin views the matrix for a user in a team without catalog_id
- **THEN** the UI shows a message that a catalog must be assigned to the team

### Requirement: Admin team catalog assignment UI
The UI SHALL allow admins to assign or change the catalog linked to a team from team management.

#### Scenario: Admin assigns catalog to team
- **WHEN** an admin selects a catalog for a team in the Teams tab
- **THEN** the team's catalog_id is updated and the selection is reflected in the teams list

#### Scenario: Admin changes team catalog
- **WHEN** an admin selects a different catalog for a team that already has one
- **THEN** the new catalog replaces the previous assignment without modifying catalog content

