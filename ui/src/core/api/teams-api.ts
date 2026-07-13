import type { ITeam, IUpdateTeamPayload } from 'core/types/user'
import { instanceAxios } from './axios'

export const fetchTeams = async (): Promise<ITeam[]> => {
  const response = await instanceAxios.get<ITeam[]>('/api/teams')
  return response.data
}

export const createTeam = async (name: string): Promise<ITeam> => {
  const response = await instanceAxios.post<ITeam>('/api/teams', { name })
  return response.data
}

export const updateTeam = async (teamId: string, payload: IUpdateTeamPayload): Promise<ITeam> => {
  const response = await instanceAxios.patch<ITeam>(`/api/teams/${teamId}`, payload)
  return response.data
}
