## ADDED Requirements

### Requirement: User grade field
The system SHALL store a grade (junior, middle, senior) for each user.

#### Scenario: Admin sets grade on user create
- **WHEN** an admin creates a user with grade "middle"
- **THEN** the user record includes grade middle

#### Scenario: Admin updates grade
- **WHEN** an admin updates a user's grade to "senior"
- **THEN** the grade is persisted and reflected in matrix target comparison

#### Scenario: Grade optional with default
- **WHEN** a user is created without explicit grade
- **THEN** grade defaults to junior

### Requirement: User team assignment in CRUD
The system SHALL include team_id in user create and update operations.

#### Scenario: Admin assigns team on create
- **WHEN** an admin creates a user with team_id
- **THEN** the user belongs to that team

#### Scenario: Admin changes user team
- **WHEN** an admin updates a user's team_id
- **THEN** the user sees the new team's competency catalog

### Requirement: User form includes grade and team
The UI SHALL display grade selector and team selector in admin user create/update forms.

#### Scenario: Update user form fields
- **WHEN** an admin opens the update user modal
- **THEN** grade and team fields are editable alongside existing fields

### Requirement: Extensible assessment authorization
The system SHALL implement canAssess as a centralized function ready for future roles (team_lead, pm).

#### Scenario: canAssess extensibility
- **WHEN** new roles are added to user_role enum
- **THEN** canAssess can be extended without changing assessment service logic

### Requirement: Points competency link schema
The system SHALL add a nullable competency_id column to the points table referencing competencies.

#### Scenario: Schema migration
- **WHEN** migration runs
- **THEN** points.competency_id exists as nullable FK with ON DELETE SET NULL

#### Scenario: Existing points unaffected
- **WHEN** migration runs on existing points
- **THEN** all existing points have competency_id NULL
