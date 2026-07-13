## ADDED Requirements

### Requirement: Team aggregates scope enforcement
The system SHALL enforce canAccessTeam on GET /api/cycles/:cycleId/aggregates based on the cycle's team_id.

#### Scenario: Lead accesses managed team aggregates
- **WHEN** a lead requests aggregates for a cycle belonging to a managed team
- **THEN** the system returns team member aggregates

#### Scenario: Lead denied other team aggregates
- **WHEN** a lead requests aggregates for a cycle of a non-managed team
- **THEN** the system returns 403 Forbidden

### Requirement: Lead assessment cycles access
Leads SHALL be allowed to create, activate, and close cycles only for managed teams via scoped API endpoints or middleware.

#### Scenario: Lead creates cycle for managed team
- **WHEN** a lead creates a cycle for a managed team with an assigned catalog
- **THEN** the cycle is created in draft status

#### Scenario: Lead cannot create cycle for other team
- **WHEN** a lead attempts to create a cycle for a non-managed team
- **THEN** the system returns 403 Forbidden

### Requirement: User cycle history for dashboards
The system SHALL provide GET /api/users/:userId/cycle-history returning per-cycle weighted_total and fill_rate for dashboard trend charts.

#### Scenario: User views own cycle history
- **WHEN** a user requests their own cycle history
- **THEN** the system returns aggregates per cycle ordered by cycle start or creation date

#### Scenario: Lead views team member cycle history
- **WHEN** a lead requests cycle history for a user in a managed team
- **THEN** the system returns that user's per-cycle aggregates

## MODIFIED Requirements

### Requirement: Assessment authorization
The system SHALL restrict assessment write operations to users passing canAssess(actor, targetUser); leads MAY assess users in managed teams.

#### Scenario: Admin can assess any user
- **WHEN** an admin updates an assessment for any team member
- **THEN** the operation succeeds

#### Scenario: Lead can assess managed team member
- **WHEN** a lead updates an assessment for a user in a managed team
- **THEN** the operation succeeds

#### Scenario: Regular user cannot assess
- **WHEN** a user with role "user" attempts to update an assessment
- **THEN** the system returns 403 Forbidden

#### Scenario: User views own assessments
- **WHEN** a user requests their own assessments in a cycle
- **THEN** the system returns read-only data

### Requirement: Admin assessment cycles UI
The UI SHALL provide an admin tab to list, create, activate, and close assessment cycles per team; leads SHALL see the same tab scoped to managed teams only.

#### Scenario: Admin creates cycle from UI
- **WHEN** an admin opens the Assessment Cycles tab, selects a team with an assigned catalog, and submits a new cycle name
- **THEN** the cycle is created in draft status and appears in the list

#### Scenario: Lead sees scoped cycles tab
- **WHEN** a lead opens /admin Assessment Cycles
- **THEN** only cycles for managed teams are shown and actionable

#### Scenario: Admin activates cycle from UI
- **WHEN** an admin activates a draft cycle from the UI
- **THEN** the cycle becomes active and the previous active cycle for the team is closed

#### Scenario: Admin closes cycle from UI
- **WHEN** an admin closes an active cycle from the UI
- **THEN** the cycle status becomes closed and assessments become read-only
