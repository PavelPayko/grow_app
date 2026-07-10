import type { IUserGrade } from 'core/types/user'
import { USER_GRADES } from 'core/types/user'

export function isValidGrade(value: unknown): value is IUserGrade {
  return typeof value === 'string' && USER_GRADES.includes(value as IUserGrade)
}

export function normalizeGrade(value: unknown): IUserGrade {
  return isValidGrade(value) ? value : 'junior'
}
