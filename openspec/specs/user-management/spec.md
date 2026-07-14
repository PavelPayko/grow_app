# user-management Specification

## Purpose
TBD - created by archiving change add-competency-matrix. Update Purpose after archive.
## Requirements
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

### Requirement: User job title field
The system SHALL store an optional `job_title` text field on each user representing their organizational position (e.g. "Тимлид Backend", "Руководитель направления QA"), independent of system role and grade.

#### Scenario: Admin sets job title on create
- **WHEN** an admin creates a user with job_title "Тимлид Backend"
- **THEN** the user record includes job_title

#### Scenario: Admin clears job title
- **WHEN** an admin updates a user with job_title set to null or empty string
- **THEN** job_title is stored as null

#### Scenario: job_title in auth_me
- **WHEN** any authenticated user requests auth_me
- **THEN** the response includes job_title when set

### Requirement: User form job title field
The UI SHALL display a "Должность" text input in admin user create/update forms for all roles.

#### Scenario: Job title field in update form
- **WHEN** an admin opens the update user modal
- **THEN** a job title field is editable alongside existing fields

### Requirement: Lead role support
The system SHALL support role `lead` in user create, update, and listing operations.

#### Scenario: Admin creates lead user
- **WHEN** an admin creates a user with role lead and optional managed_team_ids
- **THEN** the user is created with role lead and managed teams persisted

#### Scenario: Admin updates managed teams for lead
- **WHEN** an admin updates a lead user's managed_team_ids
- **THEN** user_managed_teams is replaced with the new selection

### Requirement: Scoped user listing
The system SHALL filter GET /api/users results by actor scope: admin sees all users; lead sees only users whose team_id is in managed_teams; user sees only themselves.

#### Scenario: Lead lists team members only
- **WHEN** a lead with managed teams [Backend] requests GET /api/users
- **THEN** only users with team_id Backend are returned

#### Scenario: Admin lists all users
- **WHEN** an admin requests GET /api/users
- **THEN** all users are returned

### Requirement: User form managed teams field
The UI SHALL display a managed teams multi-select when role is lead in admin user create/update forms.

#### Scenario: Managed teams field visible for lead role
- **WHEN** an admin selects role lead in the user form
- **THEN** a managed teams multi-select is shown

#### Scenario: Managed teams field hidden for user role
- **WHEN** an admin selects role user in the user form
- **THEN** the managed teams multi-select is hidden

### Requirement: auth_me managed_team_ids
The system SHALL include managed_team_ids in GET /api/auth_me response.

#### Scenario: Lead receives managed teams on login
- **WHEN** a lead calls auth_me after login
- **THEN** managed_team_ids contains all assigned team ids

### Requirement: User team assignment in CRUD
The system SHALL include team_id in user create and update operations; team_id MAY be null and is independent of managed_teams for lead users.

#### Scenario: Admin assigns team on create
- **WHEN** an admin creates a user with team_id
- **THEN** the user belongs to that team

#### Scenario: Admin creates lead without team_id
- **WHEN** an admin creates a lead with team_id null and managed teams assigned
- **THEN** the user is created successfully with no membership team

#### Scenario: Admin changes user team
- **WHEN** an admin updates a user's team_id
- **THEN** the user sees the new team's competency catalog for their own matrix

### Requirement: User form includes grade and team
The UI SHALL display grade selector and team selector in admin user create/update forms.

#### Scenario: Update user form fields
- **WHEN** an admin opens the update user modal
- **THEN** grade and team fields are editable alongside existing fields

### Requirement: Extensible assessment authorization
The system SHALL implement canAssess and canViewUser as centralized functions supporting roles user, lead, and admin.

#### Scenario: canAssess extensibility
- **WHEN** the lead role is used
- **THEN** canAssess grants access for users in managed teams without changing assessment service logic

#### Scenario: Lead can view team member assessments
- **WHEN** a lead requests assessments for a user in a managed team
- **THEN** canViewAssessment returns true

#### Scenario: User views own assessments only
- **WHEN** a user requests their own assessments
- **THEN** canViewAssessment returns true

### Requirement: Points competency link schema
The system SHALL add a nullable competency_id column to the points table referencing competencies.

#### Scenario: Schema migration
- **WHEN** migration runs
- **THEN** points.competency_id exists as nullable FK with ON DELETE SET NULL

#### Scenario: Existing points unaffected
- **WHEN** migration runs on existing points
- **THEN** all existing points have competency_id NULL

