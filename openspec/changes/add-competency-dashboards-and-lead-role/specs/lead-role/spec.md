## ADDED Requirements

### Requirement: Lead role in user_role enum
The system SHALL support a `lead` value in the `user_role` enum alongside `user` and `admin`.

#### Scenario: Admin assigns lead role
- **WHEN** an admin sets a user's role to `lead`
- **THEN** the role is persisted and included in JWT and auth_me responses

#### Scenario: Lead role in UI type definitions
- **WHEN** the frontend loads user types
- **THEN** `lead` is a valid `IUserRole` value

### Requirement: Managed teams scope
The system SHALL store team management scope for leads in `user_managed_teams(user_id, team_id)` as a many-to-many association independent of `users.team_id`.

#### Scenario: Admin assigns multiple teams to lead
- **WHEN** an admin assigns managed teams [Backend, Frontend] to a lead user
- **THEN** both team ids are stored in user_managed_teams for that user

#### Scenario: Membership and scope are independent
- **WHEN** a lead has team_id NULL and managed teams [Backend, Frontend]
- **THEN** the user can access Backend and Frontend scope without being a member of either team

#### Scenario: Lead with membership outside managed teams
- **WHEN** a lead has team_id Platform and managed teams [Backend, Frontend]
- **THEN** both membership and managed scope are valid without requiring team_id to be in managed teams

#### Scenario: Non-lead managed teams cleared
- **WHEN** an admin changes a user's role from lead to user
- **THEN** all rows in user_managed_teams for that user are removed

### Requirement: canAccessTeam authorization
The system SHALL implement `canAccessTeam(actor, teamId)` where admin returns true for any team and lead returns true only when teamId is in actor's managed teams.

#### Scenario: Admin accesses any team
- **WHEN** an admin requests data scoped to any team_id
- **THEN** access is granted

#### Scenario: Lead accesses managed team
- **WHEN** a lead requests data for a team in their managed_teams
- **THEN** access is granted

#### Scenario: Lead denied other team
- **WHEN** a lead requests data for a team not in their managed_teams
- **THEN** the system returns 403 Forbidden

### Requirement: canViewUser authorization
The system SHALL allow viewing a user profile when actor is admin, actor is the target user, or actor is lead and target user's team_id is in actor's managed teams.

#### Scenario: Lead views team member
- **WHEN** a lead requests profile or matrix for a user in a managed team
- **THEN** the operation succeeds

#### Scenario: Lead cannot view user outside scope
- **WHEN** a lead requests profile for a user in a team outside managed_teams
- **THEN** the system returns 403 Forbidden

#### Scenario: Lead views own profile
- **WHEN** a lead requests their own profile regardless of managed_teams
- **THEN** the operation succeeds

### Requirement: canAssess for lead role
The system SHALL allow leads to assess users in managed teams using the existing canAssess flow.

#### Scenario: Lead assesses team member
- **WHEN** a lead updates an assessment for a user whose team_id is in managed_teams
- **THEN** the operation succeeds

#### Scenario: Lead cannot assess outside scope
- **WHEN** a lead attempts to assess a user outside managed_teams
- **THEN** the system returns 403 Forbidden

### Requirement: Managed teams in auth_me
The system SHALL include `managed_team_ids` array in GET /api/auth_me for lead users.

#### Scenario: Lead auth_me includes scope
- **WHEN** a lead requests auth_me
- **THEN** the response includes managed_team_ids with all assigned team ids

#### Scenario: Non-lead auth_me omits or empty managed teams
- **WHEN** a user or admin requests auth_me
- **THEN** managed_team_ids is an empty array or omitted

### Requirement: Admin assigns managed teams in user CRUD
The UI SHALL provide a multi-select for managed teams when role is lead in admin user create/update forms; only admins may edit this field.

#### Scenario: Admin sets managed teams on create
- **WHEN** an admin creates a user with role lead and selects teams Backend and QA
- **THEN** user_managed_teams rows are created for both teams

#### Scenario: Lead cannot edit managed teams
- **WHEN** a lead opens admin user management
- **THEN** the Users tab is not available

### Requirement: Trimmed admin panel for lead
The system SHALL allow leads to access /admin with only the Assessment Cycles tab visible, scoped to managed teams.

#### Scenario: Lead sees cycles tab only
- **WHEN** a lead navigates to /admin
- **THEN** only the Assessment Cycles tab is shown

#### Scenario: Lead cycles scoped to managed teams
- **WHEN** a lead opens Assessment Cycles
- **THEN** only cycles belonging to managed teams are listed and actionable

### Requirement: Lead empty scope state
The system SHALL show an informative empty state when a lead has no managed teams assigned.

#### Scenario: Lead with zero managed teams
- **WHEN** a lead with role lead and empty managed_teams opens the main view
- **THEN** the UI displays a message to contact an administrator
