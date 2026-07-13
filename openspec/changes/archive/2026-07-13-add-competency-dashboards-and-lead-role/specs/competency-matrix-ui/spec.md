## ADDED Requirements

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

## MODIFIED Requirements

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
