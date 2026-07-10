# teams Specification

## Purpose
TBD - created by archiving change add-competency-matrix. Update Purpose after archive.
## Requirements
### Requirement: Team entity exists
The system SHALL store teams as first-class entities with a unique name and creation timestamp.

#### Scenario: Admin creates a team
- **WHEN** an admin submits a new team name
- **THEN** the system creates a team record and returns its id

#### Scenario: Duplicate team name rejected
- **WHEN** an admin attempts to create a team with an existing name
- **THEN** the system returns a validation error

### Requirement: Users belong to a team
The system SHALL associate each user with exactly one team via `team_id`.

#### Scenario: New user assigned to team
- **WHEN** an admin creates a user with a team_id
- **THEN** the user is linked to that team

#### Scenario: Existing users migrated to default team
- **WHEN** the migration runs on an existing database
- **THEN** all users without team_id are assigned to a default team

### Requirement: Team listing
The system SHALL allow authenticated admins to list all teams.

#### Scenario: Admin lists teams
- **WHEN** an admin requests GET /api/teams
- **THEN** the system returns all teams ordered by name

### Requirement: Admin teams management UI
The UI SHALL provide an admin tab to list teams and create new teams.

#### Scenario: Admin creates team from UI
- **WHEN** an admin opens the Teams tab and submits a new team name
- **THEN** the team is created and appears in the teams list

#### Scenario: Duplicate team name in UI
- **WHEN** an admin submits a team name that already exists
- **THEN** the UI displays the validation error from the API

### Requirement: User sees own team context
The system SHALL include team_id in user profile responses for authenticated users.

#### Scenario: User profile includes team
- **WHEN** a user requests GET /api/auth_me
- **THEN** the response includes team_id and team name

