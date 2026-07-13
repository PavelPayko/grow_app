## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Admin team catalog assignment UI
The UI SHALL allow admins to assign or change the catalog linked to a team from team management.

#### Scenario: Admin assigns catalog to team
- **WHEN** an admin selects a catalog for a team in the Teams tab
- **THEN** the team's catalog_id is updated and the selection is reflected in the teams list

#### Scenario: Admin changes team catalog
- **WHEN** an admin selects a different catalog for a team that already has one
- **THEN** the new catalog replaces the previous assignment without modifying catalog content
