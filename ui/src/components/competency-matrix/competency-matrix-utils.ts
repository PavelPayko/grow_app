import type { AxiosError } from 'axios'

import { readStoredUser } from 'core/utils/current-user-storage'

type ApiError = AxiosError<{ error: string }>

export function getApiError(error: unknown): string {
  return (error as ApiError)?.response?.data?.error || 'Произошла ошибка'
}

export function getStoredUser() {
  return readStoredUser()
}

export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value * 100)}%`
}

export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return value.toFixed(2)
}
