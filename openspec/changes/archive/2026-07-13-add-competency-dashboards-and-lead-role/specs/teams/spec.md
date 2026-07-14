## ADDED Requirements

### Requirement: Team selector in main sidebar
The UI SHALL provide a team selector in the main sidebar for admin (all teams) and lead (managed teams only when count > 1); selecting a team filters the employee list and sets context for the team dashboard.

#### Scenario: Admin selects team in sidebar
- **WHEN** an admin selects team Backend in the sidebar selector
- **THEN** the employee list shows only Backend members

#### Scenario: Lead selector shows managed teams only
- **WHEN** a lead with managed teams [Backend, Frontend] uses the team selector
- **THEN** only Backend and Frontend are available

## MODIFIED Requirements

### Requirement: Team listing
The system SHALL allow authenticated admins to list all teams and leads to list only teams in their managed_teams, including catalog_id and catalog name when present.

#### Scenario: Admin lists teams
- **WHEN** an admin requests GET /api/teams
- **THEN** the system returns all teams ordered by name with catalog_id and catalog name when assigned

#### Scenario: Lead lists managed teams only
- **WHEN** a lead requests GET /api/teams
- **THEN** the system returns only teams in managed_teams ordered by name

#### Scenario: User cannot list teams
- **WHEN** a user with role user requests GET /api/teams
- **THEN** the system returns 403 Forbidden

### Requirement: User sees own team context
The system SHALL include team_id, team name, role, and managed_team_ids (for leads) in user profile responses for authenticated users.

#### Scenario: User profile includes team
- **WHEN** a user requests GET /api/auth_me
- **THEN** the response includes team_id, team name, role, and managed_team_ids
