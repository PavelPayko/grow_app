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

### Requirement: Team catalog assignment
The system SHALL allow a team to reference exactly one competency catalog via optional `catalog_id`, assignable and changeable by an admin.

#### Scenario: Admin assigns catalog to team
- **WHEN** an admin sets catalog_id for a team via PATCH /api/teams/:id
- **THEN** the team is linked to that catalog

#### Scenario: Admin changes team catalog
- **WHEN** an admin updates a team's catalog_id to a different catalog
- **THEN** the new catalog becomes the team's active catalog for matrix and new cycles

#### Scenario: Team without catalog
- **WHEN** a team has no catalog_id
- **THEN** competency matrix and cycle creation for that team indicate that a catalog must be assigned

#### Scenario: Multiple teams share one catalog
- **WHEN** two teams are assigned the same catalog_id
- **THEN** both teams use the same catalog structure for assessments

### Requirement: Team listing
The system SHALL allow authenticated admins to list all teams including their assigned catalog_id and catalog name when present.

#### Scenario: Admin lists teams
- **WHEN** an admin requests GET /api/teams
- **THEN** the system returns all teams ordered by name with catalog_id and catalog name when assigned

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
