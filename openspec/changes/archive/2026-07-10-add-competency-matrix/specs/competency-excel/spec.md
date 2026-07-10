## ADDED Requirements

### Requirement: Excel export
The system SHALL export assessment data to `.xlsx` matching the template structure with three sheets: Оценка_сотрудников, Итоги, Итоги_по_блокам.

#### Scenario: Export active cycle
- **WHEN** an admin requests export for a team and cycle
- **THEN** the system downloads an xlsx file with all team members' assessments and calculated totals

#### Scenario: Export formulas match template
- **WHEN** the exported file is opened in Excel
- **THEN** Итоги and Итоги_по_блокам sheets contain correct weighted totals matching server calculations

### Requirement: Excel import
The system SHALL import assessment data from `.xlsx` files matching the template format.

#### Scenario: Import assessments
- **WHEN** an admin uploads a valid xlsx for a selected team and cycle
- **THEN** scores and evidence are upserted for matched employees

#### Scenario: Employee matching by name
- **WHEN** import file contains employee names in column headers
- **THEN** the system matches employees by full_name within the team

#### Scenario: Unmatched employees reported
- **WHEN** import file contains names not found in the team
- **THEN** the system returns a report listing unmatched names without failing the entire import

#### Scenario: Import validation errors
- **WHEN** import file contains scores outside 0–3
- **THEN** the system rejects the file with validation details

### Requirement: Import catalog from Excel
The system SHALL support importing or updating catalog structure (blocks, domains, competencies, weights) from the Оценка_сотрудников sheet.

#### Scenario: Import catalog items
- **WHEN** an admin imports a file with new competency rows
- **THEN** new catalog items are created in the team's catalog

#### Scenario: Import overwrites assessments in selected cycle
- **WHEN** an admin confirms import for an existing cycle
- **THEN** existing assessments for matched competencies are overwritten with imported values

### Requirement: Import/export authorization
The system SHALL restrict import and export operations to admin role.

#### Scenario: Non-admin denied export
- **WHEN** a user with role "user" requests export
- **THEN** the system returns 403 Forbidden

### Requirement: Excel import/export UI
The UI SHALL provide admin-only export and import controls on the matrix view for the selected cycle.

#### Scenario: Admin exports from matrix
- **WHEN** an admin clicks Export on the matrix view for a selected cycle
- **THEN** the browser downloads the cycle xlsx file

#### Scenario: Admin imports with overwrite confirmation
- **WHEN** an admin uploads an xlsx for the selected active cycle and confirms import
- **THEN** assessments are imported and an import report is displayed

#### Scenario: Import report shows unmatched items
- **WHEN** import completes with unmatched employees or competencies
- **THEN** the UI displays summary counts and detailed unmatched lists
