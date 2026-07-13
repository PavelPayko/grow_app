## MODIFIED Requirements

### Requirement: Assessment cycles
The system SHALL support assessment cycles per team with statuses: draft, active, closed. A cycle's catalog_id MUST match the team's assigned catalog at creation time.

#### Scenario: Admin creates cycle
- **WHEN** an admin creates a cycle with name "Q1 2026" for a team that has an assigned catalog
- **THEN** the cycle is created in draft status with catalog_id equal to the team's catalog_id

#### Scenario: Cycle creation rejected without team catalog
- **WHEN** an admin attempts to create a cycle for a team without catalog_id
- **THEN** the system returns a validation error

#### Scenario: Admin activates cycle
- **WHEN** an admin activates a draft cycle
- **THEN** the cycle status becomes active and a grade snapshot is recorded for each team member

#### Scenario: Closed cycle is read-only
- **WHEN** a cycle has status closed
- **THEN** assessments in that cycle cannot be modified

### Requirement: Admin assessment cycles UI
The UI SHALL provide an admin tab to list, create, activate, and close assessment cycles per team.

#### Scenario: Admin creates cycle from UI
- **WHEN** an admin opens the Assessment Cycles tab, selects a team with an assigned catalog, and submits a new cycle name
- **THEN** the cycle is created in draft status and appears in the list

#### Scenario: Admin activates cycle from UI
- **WHEN** an admin activates a draft cycle from the UI
- **THEN** the cycle becomes active and the previous active cycle for the team is closed

#### Scenario: Admin closes cycle from UI
- **WHEN** an admin closes an active cycle from the UI
- **THEN** the cycle status becomes closed and assessments become read-only
