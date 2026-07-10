# competency-assessment Specification

## Purpose
TBD - created by archiving change add-competency-matrix. Update Purpose after archive.
## Requirements
### Requirement: Assessment cycles
The system SHALL support assessment cycles per team with statuses: draft, active, closed.

#### Scenario: Admin creates cycle
- **WHEN** an admin creates a cycle with name "Q1 2026" for a team
- **THEN** the cycle is created in draft status

#### Scenario: Admin activates cycle
- **WHEN** an admin activates a draft cycle
- **THEN** the cycle status becomes active and a grade snapshot is recorded for each team member

#### Scenario: Closed cycle is read-only
- **WHEN** a cycle has status closed
- **THEN** assessments in that cycle cannot be modified

### Requirement: Competency assessments
The system SHALL store per-user, per-competency, per-cycle assessments with score (0–3 or null), evidence text, assessed_by, and assessed_at.

#### Scenario: Admin assigns score
- **WHEN** an admin sets score 2 with evidence for a user competency in an active cycle
- **THEN** the assessment is saved with assessed_by set to the admin's user id

#### Scenario: Score validation
- **WHEN** an admin submits a score outside 0–3
- **THEN** the system returns a validation error

#### Scenario: Unassessed competency
- **WHEN** no assessment exists for a competency
- **THEN** score is treated as null and excluded from weighted calculations

### Requirement: Weighted aggregate calculations
The system SHALL calculate aggregates matching the Excel template formulas.

#### Scenario: Weighted total per user
- **WHEN** a user has scores for a subset of competencies
- **THEN** weighted_total = Σ(score × weight) / Σ(weight of scored competencies)

#### Scenario: Unweighted average
- **WHEN** scores exist for a user
- **THEN** unweighted_avg = average of non-null scores

#### Scenario: Fill rate
- **WHEN** a user has N scored competencies out of M total in catalog
- **THEN** fill_rate = N / M

#### Scenario: Block-level weighted total
- **WHEN** block aggregates are requested
- **THEN** weighted_total is calculated using only competencies within that block

### Requirement: Target comparison
The system SHALL compare block-level weighted totals against grade target ranges using the user's grade (from cycle snapshot or current grade).

#### Scenario: In range
- **WHEN** block weighted total is between min_score and max_score for user's grade
- **THEN** target status is "in_range"

#### Scenario: Below target
- **WHEN** block weighted total is below min_score
- **THEN** target status is "below"

#### Scenario: Above target
- **WHEN** block weighted total is above max_score
- **THEN** target status is "above"

### Requirement: Assessment authorization
The system SHALL restrict assessment write operations to users passing canAssess(actor, targetUser).

#### Scenario: Admin can assess any user
- **WHEN** an admin updates an assessment for any team member
- **THEN** the operation succeeds

#### Scenario: Regular user cannot assess
- **WHEN** a user with role "user" attempts to update an assessment
- **THEN** the system returns 403 Forbidden

#### Scenario: User views own assessments
- **WHEN** a user requests their own assessments in a cycle
- **THEN** the system returns read-only data

### Requirement: Re-assessment via new cycles
The system SHALL preserve historical assessments when a new cycle is created; previous cycle data remains accessible.

#### Scenario: Historical cycle preserved
- **WHEN** a new active cycle is created after closing Q4 2025
- **THEN** Q4 2025 assessments remain queryable and unchanged

### Requirement: Admin assessment cycles UI
The UI SHALL provide an admin tab to list, create, activate, and close assessment cycles per team.

#### Scenario: Admin creates cycle from UI
- **WHEN** an admin opens the Assessment Cycles tab, selects a team with an active catalog, and submits a new cycle name
- **THEN** the cycle is created in draft status and appears in the list

#### Scenario: Admin activates cycle from UI
- **WHEN** an admin activates a draft cycle from the UI
- **THEN** the cycle becomes active and the previous active cycle for the team is closed

#### Scenario: Admin closes cycle from UI
- **WHEN** an admin closes an active cycle from the UI
- **THEN** the cycle status becomes closed and assessments become read-only

