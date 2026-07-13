## ADDED Requirements

### Requirement: Employee dashboard with IPR and competency sections
The system SHALL display an employee dashboard on the "Дашборд" tab combining existing IPR charts (goals and achievements) with competency visualizations for the viewed user.

#### Scenario: User sees own combined dashboard
- **WHEN** a user opens their Dashboard tab
- **THEN** IPR charts and competency sections are shown for their own data

#### Scenario: Admin views employee combined dashboard
- **WHEN** an admin selects an employee and opens the Dashboard tab
- **THEN** IPR charts and competency sections are shown for that employee

#### Scenario: Lead views employee in managed team
- **WHEN** a lead selects an employee from a managed team and opens Dashboard
- **THEN** IPR charts and competency sections are shown for that employee

### Requirement: Competency blocks versus target chart
The employee dashboard competency section SHALL include a chart showing weighted_total per block with target range indicators for the user's grade.

#### Scenario: Block chart uses active cycle
- **WHEN** the competency section loads
- **THEN** block totals and targets are from the user's team active assessment cycle

### Requirement: Competency cycle history trend
The employee dashboard SHALL show a line chart of weighted_total and fill_rate across closed and active cycles for the user.

#### Scenario: Multiple cycles shown chronologically
- **WHEN** a user has assessments in Q4 2025 and Q1 2026 cycles
- **THEN** both cycles appear on the trend chart in chronological order

### Requirement: Development zones list
The employee dashboard SHALL list top competencies with the lowest scores (score not null, sorted ascending, limited to 5) as development focus areas.

#### Scenario: Unassessed competencies excluded
- **WHEN** a competency has no score in the active cycle
- **THEN** it is excluded from the development zones list

### Requirement: Manager insight blocks for admin and lead
When an admin or lead views an employee dashboard, the system SHALL show additional insight blocks not visible to the employee: cycle-over-cycle delta for weighted_total and per-block target summary (counts below / in_range / above).

#### Scenario: Employee does not see insight blocks
- **WHEN** a user views their own dashboard
- **THEN** manager insight blocks are hidden

#### Scenario: Admin sees delta from previous cycle
- **WHEN** an admin views an employee with assessments in current and previous closed cycle
- **THEN** the insight block shows weighted_total delta between cycles

#### Scenario: Lead sees insight blocks for managed team member
- **WHEN** a lead views dashboard for a user in a managed team
- **THEN** manager insight blocks are visible

#### Scenario: Lead denied insight for out-of-scope user
- **WHEN** a lead attempts to view dashboard for a user outside managed teams
- **THEN** the system returns 403 Forbidden or does not load the view

### Requirement: My profile entry for lead
The system SHALL provide a "Мой профиль" entry or header avatar navigation so a lead can open their own dashboard even when their team_id is not in managed_teams or is null.

#### Scenario: Lead opens own profile from header
- **WHEN** a lead clicks their profile entry in the header or sidebar
- **THEN** their own employee dashboard opens
