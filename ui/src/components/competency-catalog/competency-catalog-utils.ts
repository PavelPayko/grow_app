import type { AxiosError } from 'axios'

type ApiError = AxiosError<{ error: string }>

export function getApiError(error: unknown): string {
  return (error as ApiError)?.response?.data?.error || 'Произошла ошибка'
}
