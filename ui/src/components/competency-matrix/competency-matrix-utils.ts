import type { AxiosError } from 'axios'

import type { IUser } from 'core/types/user'

type ApiError = AxiosError<{ error: string }>

export function getApiError(error: unknown): string {
  return (error as ApiError)?.response?.data?.error || 'Произошла ошибка'
}

export function getStoredUser(): IUser | null {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    return JSON.parse(raw) as IUser
  } catch {
    return null
  }
}

export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value * 100)}%`
}

export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return value.toFixed(2)
}
