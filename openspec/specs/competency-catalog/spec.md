# competency-catalog Specification

## Purpose
TBD - created by archiving change add-competency-matrix. Update Purpose after archive.
## Requirements
### Requirement: Team-scoped competency catalog
The system SHALL maintain a competency catalog per team containing blocks, domains, and competencies.

#### Scenario: Catalog structure
- **WHEN** a catalog exists for a team
- **THEN** it contains blocks, each with domains, each with competencies having name, weight (>0), level_criterion text, and sort_order

### Requirement: Admin CRUD for catalog items
The system SHALL allow admins to create, read, update, and delete blocks, domains, and competencies within a team's catalog.

#### Scenario: Admin adds competency
- **WHEN** an admin creates a competency under a domain with weight 1.5 and criterion text
- **THEN** the competency is persisted and visible in the catalog

#### Scenario: Admin updates competency weight
- **WHEN** an admin changes a competency weight
- **THEN** future aggregate calculations use the updated weight

#### Scenario: Admin cannot delete competency with assessments
- **WHEN** an admin attempts to delete a competency that has assessments in any cycle
- **THEN** the system rejects the deletion with an error

### Requirement: Grade targets per block
The system SHALL store target score ranges (min, max) per block and grade (junior, middle, senior).

#### Scenario: Target ranges defined
- **WHEN** grade targets exist for block "NAC Core" and grade "middle"
- **THEN** min_score and max_score define the acceptable weighted block total range

#### Scenario: Admin updates targets
- **WHEN** an admin modifies grade target ranges for a block
- **THEN** target comparison in the matrix UI reflects the new ranges

### Requirement: Catalog cloning
The system SHALL allow admins to clone an existing team's catalog as a new catalog for another team.

#### Scenario: Clone catalog
- **WHEN** an admin clones team A catalog to team B
- **THEN** team B receives a copy of all blocks, domains, competencies, and grade targets

### Requirement: Default catalog seed
The system SHALL seed a default catalog from the Excel template (29 competencies, 5 blocks) for the default team on migration.

#### Scenario: Migration seed
- **WHEN** database migration runs on a fresh install
- **THEN** the default team has a populated catalog matching the template structure

