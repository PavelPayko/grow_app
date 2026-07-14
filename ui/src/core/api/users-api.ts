import type { IUser, IUserCreate, IUserUpdate } from 'core/types/user'
import type { IUserCycleHistoryEntry } from 'core/types/competency'
import { instanceAxios } from './axios'

export const fetchUsers = async (): Promise<IUser[]> => {
  const response = await instanceAxios.get<IUser[]>('/api/users')
  return response.data
}

export const fetchUserCycleHistory = async (
  userId: string
): Promise<IUserCycleHistoryEntry[]> => {
  const response = await instanceAxios.get<IUserCycleHistoryEntry[]>(
    `/api/users/${userId}/cycle-history`
  )
  return response.data
}

export const addUser = async (userData: IUserCreate): Promise<IUser> => {
  const response = await instanceAxios.post<IUser>('/api/users', userData)
  return response.data
}

export const updateUser = async (id: string, userData: IUserUpdate): Promise<IUser> => {
  const response = await instanceAxios.put<IUser>(`/api/users/${id}`, userData)
  return response.data
}
