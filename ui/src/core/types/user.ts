export type IUserRole = 'user' | 'admin' | 'lead'
export type IUserGrade = 'junior' | 'middle' | 'senior'

export const USER_ROLES: IUserRole[] = ['user', 'admin', 'lead']

export const USER_GRADES: IUserGrade[] = ['junior', 'middle', 'senior']

export const USER_ROLE_LABELS: Record<IUserRole, string> = {
  user: 'Сотрудник',
  admin: 'Администратор',
  lead: 'Руководитель',
}

export const USER_GRADE_LABELS: Record<IUserGrade, string> = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
}

export function formatGradeLabel(grade: IUserGrade | null | undefined): string | null {
  if (!grade) return null
  return USER_GRADE_LABELS[grade]
}

export interface IUser {
  id: string
  login: string
  password?: string
  full_name: string
  phone: string
  email: string
  role: IUserRole
  team_id: string | null
  team_name?: string | null
  grade: IUserGrade | null
  job_title?: string | null
  managed_team_ids?: string[]
  created_at: string
}

export interface IUserCreate {
  login: string
  password: string
  full_name: string
  phone: string
  email: string
  role?: IUserRole
  team_id?: string | null
  grade?: IUserGrade | null
  job_title?: string | null
  managed_team_ids?: string[]
}

export interface IUserUpdate {
  full_name: string
  phone: string
  email: string
  role: IUserRole
  team_id?: string | null
  grade?: IUserGrade | null
  job_title?: string | null
  managed_team_ids?: string[]
}

export interface ITeam {
  id: string
  name: string
  catalog_id?: string | null
  catalog_name?: string | null
  created_at: string
}

export interface IUpdateTeamPayload {
  name?: string
  catalog_id?: string | null
}
