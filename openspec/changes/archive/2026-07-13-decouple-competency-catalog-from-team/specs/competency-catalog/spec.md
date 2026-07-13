## REMOVED Requirements

### Requirement: Team-scoped competency catalog
**Reason**: Каталог больше не принадлежит команде; привязка вынесена в `teams.catalog_id`.
**Migration**: Существующие активные каталоги сохраняются как независимые записи; командам проставляется `catalog_id` по бывшей активной привязке.

### Requirement: Catalog cloning
**Reason**: Заменено клонированием независимого каталога без участия команд.
**Migration**: Использовать `POST /api/catalogs/:catalogId/clone` вместо клонирования между командами.

## ADDED Requirements

### Requirement: Independent competency catalogs
The system SHALL store competency catalogs as standalone entities with a unique name and creation timestamp, independent of teams.

#### Scenario: Catalog structure
- **WHEN** a catalog exists
- **THEN** it contains blocks, each with domains, each with competencies having name, weight (>0), level_criterion text, and sort_order

#### Scenario: Admin lists catalogs
- **WHEN** an admin requests GET /api/catalogs
- **THEN** the system returns all catalogs ordered by name

#### Scenario: Admin creates catalog
- **WHEN** an admin submits a new catalog name via POST /api/catalogs
- **THEN** the catalog is created without requiring a team_id

#### Scenario: Admin updates catalog name
- **WHEN** an admin changes a catalog name via PATCH /api/catalogs/:id
- **THEN** the updated name is persisted

### Requirement: Catalog deletion
The system SHALL allow admins to delete a catalog that is not referenced by any team or assessment cycle.

#### Scenario: Admin deletes unused catalog
- **WHEN** an admin deletes a catalog via DELETE /api/catalogs/:id that is not linked to any team or cycle
- **THEN** the catalog and its structure (blocks, domains, competencies, grade targets) are removed

#### Scenario: Catalog not deleted while linked to team
- **WHEN** an admin attempts to delete a catalog referenced by any team
- **THEN** the system rejects the deletion with an error

#### Scenario: Catalog not deleted while used in cycles
- **WHEN** an admin attempts to delete a catalog referenced by any assessment cycle
- **THEN** the system rejects the deletion with an error

### Requirement: Catalog duplication
The system SHALL allow admins to duplicate an existing catalog into a new independent catalog.

#### Scenario: Duplicate catalog
- **WHEN** an admin duplicates catalog A with name "Catalog A (copy)"
- **THEN** a new catalog is created with copies of all blocks, domains, competencies, and grade targets from catalog A

#### Scenario: Source catalog unchanged after duplicate
- **WHEN** an admin duplicates a catalog
- **THEN** the source catalog and its structure remain unchanged

## MODIFIED Requirements

### Requirement: Admin CRUD for catalog items
The system SHALL allow admins to create, read, update, and delete blocks, domains, and competencies within a catalog selected by catalog id.

#### Scenario: Admin adds competency
- **WHEN** an admin creates a competency under a domain with weight 1.5 and criterion text
- **THEN** the competency is persisted and visible in the catalog

#### Scenario: Admin updates competency weight
- **WHEN** an admin changes a competency weight
- **THEN** future aggregate calculations use the updated weight

#### Scenario: Admin cannot delete competency with assessments
- **WHEN** an admin attempts to delete a competency that has assessments in any cycle
- **THEN** the system rejects the deletion with an error

### Requirement: Default catalog seed
The system SHALL seed a default catalog from the Excel template (29 competencies, 5 blocks) as a standalone catalog and link it to the default team on migration.

#### Scenario: Migration seed
- **WHEN** database migration runs on a fresh install
- **THEN** a default catalog exists and the default team has catalog_id pointing to it
