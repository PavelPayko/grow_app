# team-dashboard Specification

## Purpose
Team competency dashboard for admins and leads with cycle progress, heatmap, and summary table.

## Requirements
### Requirement: Team dashboard tab for admin and lead
The system SHALL display a team competency dashboard on the "Дашборд" tab when an admin or lead has no specific employee selected in the sidebar.

#### Scenario: Admin sees team dashboard in all-users view
- **WHEN** an admin selects no employee and opens the Dashboard tab
- **THEN** the team dashboard is shown instead of the legacy points bar chart

#### Scenario: Lead sees team dashboard by default
- **WHEN** a lead opens the application with managed teams assigned
- **THEN** the team dashboard for the selected team is shown on the Dashboard tab

#### Scenario: Regular user does not see team dashboard
- **WHEN** a user with role user opens the Dashboard tab
- **THEN** the employee dashboard is shown, not the team dashboard

### Requirement: Team and cycle selectors
The team dashboard SHALL include a cycle selector for the active assessment cycle of the selected team; a team selector SHALL appear when the actor has access to more than one team.

#### Scenario: Admin team selector
- **WHEN** an admin views the team dashboard
- **THEN** a team selector lists all teams

#### Scenario: Lead team selector when multiple managed teams
- **WHEN** a lead has more than one managed team
- **THEN** a team selector lists only managed teams

#### Scenario: Single team hides selector
- **WHEN** a lead has exactly one managed team
- **THEN** the team selector is hidden and that team is used by default

#### Scenario: Cycle defaults to active
- **WHEN** the team dashboard loads for a team with an active cycle
- **THEN** the active cycle is selected by default

### Requirement: Cycle progress widget
The team dashboard SHALL show cycle fill progress: average fill_rate across team members, count of fully assessed members, and count of members below 50% fill_rate.

#### Scenario: Progress reflects team aggregates
- **WHEN** the team dashboard loads for a cycle with partial assessments
- **THEN** progress metrics are calculated from GET /api/cycles/:cycleId/aggregates

### Requirement: Team heatmap by blocks
The team dashboard SHALL display a heatmap of team members versus competency blocks colored by target status (below / in_range / above).

#### Scenario: Heatmap cell shows target status
- **WHEN** a team member has a block aggregate with target status below
- **THEN** the corresponding heatmap cell is styled as below target

#### Scenario: Heatmap row navigates to employee
- **WHEN** an admin or lead clicks a team member row in the heatmap
- **THEN** the sidebar selects that employee and their profile opens

### Requirement: Team summary table
The team dashboard SHALL include a sortable table with columns: full name, job_title (when set), grade, weighted_total, fill_rate, and count of blocks below target.

#### Scenario: Table shows job title
- **WHEN** a team member has job_title "Тимлид Backend"
- **THEN** the job_title column displays that value

#### Scenario: Table sorted by fill rate
- **WHEN** an admin sorts by fill_rate ascending
- **THEN** members with lowest fill_rate appear first

### Requirement: Team dashboard API scope
The team dashboard SHALL fetch aggregates via GET /api/cycles/:cycleId/aggregates with server-side validation that the cycle's team_id is accessible to the actor.

#### Scenario: Lead denied aggregates for other team cycle
- **WHEN** a lead requests aggregates for a cycle belonging to a non-managed team
- **THEN** the system returns 403 Forbidden
