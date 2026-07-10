## ADDED Requirements

### Requirement: Matrix tab in user content area
The system SHALL display a "Матрица" tab alongside "Таймлайн" and "Дашборд" when viewing a specific user.

#### Scenario: Tab visible for selected user
- **WHEN** an admin or user views an employee profile in the main content area
- **THEN** a "Матрица" tab is available

#### Scenario: Tab hidden in all-users view
- **WHEN** no specific user is selected (all-users dashboard view)
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
The system SHALL allow admins to edit score (0–3 select) and evidence (text input) inline when viewing an active cycle.

#### Scenario: Admin edits score
- **WHEN** an admin selects score 3 for a competency in an active cycle
- **THEN** the assessment is saved and aggregates update

#### Scenario: User read-only view
- **WHEN** a regular user views their own matrix
- **THEN** score and evidence fields are read-only

#### Scenario: Closed cycle read-only for all
- **WHEN** viewing a closed cycle
- **THEN** no editing controls are shown regardless of role

### Requirement: Admin catalog management entry point
The system SHALL provide admin access to catalog CRUD from the admin area or matrix context.

#### Scenario: Admin opens catalog editor
- **WHEN** an admin navigates to catalog management for a team
- **THEN** they can manage blocks, domains, competencies, and grade targets
