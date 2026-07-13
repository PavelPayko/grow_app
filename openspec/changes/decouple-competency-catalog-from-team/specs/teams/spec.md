## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Team listing
The system SHALL allow authenticated admins to list all teams including their assigned catalog_id and catalog name when present.

#### Scenario: Admin lists teams
- **WHEN** an admin requests GET /api/teams
- **THEN** the system returns all teams ordered by name with catalog_id and catalog name when assigned
