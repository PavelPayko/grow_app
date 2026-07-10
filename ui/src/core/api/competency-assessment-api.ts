import type {
  IAssessmentCycle,
  IAssessmentUpsertPayload,
  ICompetencyAssessment,
  ICreateCyclePayload,
  IImportResult,
  ITeamAggregateUser,
  IUserAggregates,
  IUserMatrixResponse,
} from 'core/types/competency'
import { instanceAxios } from './axios'

export const fetchTeamCycles = async (teamId: string): Promise<IAssessmentCycle[]> => {
  const response = await instanceAxios.get<IAssessmentCycle[]>(`/api/teams/${teamId}/cycles`)
  return response.data
}

export const fetchActiveTeamCycle = async (
  teamId: string
): Promise<IAssessmentCycle | null> => {
  const response = await instanceAxios.get<IAssessmentCycle | null>(
    `/api/teams/${teamId}/cycles/active`
  )
  return response.data
}

export const createTeamCycle = async (
  teamId: string,
  payload: ICreateCyclePayload
): Promise<IAssessmentCycle> => {
  const response = await instanceAxios.post<IAssessmentCycle>(
    `/api/teams/${teamId}/cycles`,
    payload
  )
  return response.data
}

export const fetchCycle = async (cycleId: string): Promise<IAssessmentCycle> => {
  const response = await instanceAxios.get<IAssessmentCycle>(`/api/cycles/${cycleId}`)
  return response.data
}

export const activateCycle = async (cycleId: string): Promise<IAssessmentCycle> => {
  const response = await instanceAxios.post<IAssessmentCycle>(`/api/cycles/${cycleId}/activate`)
  return response.data
}

export const closeCycle = async (cycleId: string): Promise<IAssessmentCycle> => {
  const response = await instanceAxios.post<IAssessmentCycle>(`/api/cycles/${cycleId}/close`)
  return response.data
}

export const fetchUserAssessments = async (
  cycleId: string,
  userId: string
): Promise<ICompetencyAssessment[]> => {
  const response = await instanceAxios.get<ICompetencyAssessment[]>(
    `/api/cycles/${cycleId}/users/${userId}/assessments`
  )
  return response.data
}

export const upsertUserAssessment = async (
  cycleId: string,
  userId: string,
  competencyId: string,
  payload: IAssessmentUpsertPayload
): Promise<ICompetencyAssessment> => {
  const response = await instanceAxios.put<ICompetencyAssessment>(
    `/api/cycles/${cycleId}/users/${userId}/assessments/${competencyId}`,
    payload
  )
  return response.data
}

export const fetchUserAggregates = async (
  cycleId: string,
  userId: string
): Promise<IUserAggregates> => {
  const response = await instanceAxios.get<IUserAggregates>(
    `/api/cycles/${cycleId}/users/${userId}/aggregates`
  )
  return response.data
}

export const fetchTeamAggregates = async (cycleId: string): Promise<ITeamAggregateUser[]> => {
  const response = await instanceAxios.get<ITeamAggregateUser[]>(
    `/api/cycles/${cycleId}/aggregates`
  )
  return response.data
}

export const fetchUserMatrix = async (
  cycleId: string,
  userId: string
): Promise<IUserMatrixResponse> => {
  const response = await instanceAxios.get<IUserMatrixResponse>(
    `/api/cycles/${cycleId}/users/${userId}/matrix`
  )
  return response.data
}

export const exportCycleExcel = async (cycleId: string): Promise<Blob> => {
  const response = await instanceAxios.get<Blob>(`/api/cycles/${cycleId}/export`, {
    responseType: 'blob',
  })
  return response.data
}

export const importCycleExcel = async (
  cycleId: string,
  file: File,
  importCatalog = true
): Promise<IImportResult> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('import_catalog', String(importCatalog))

  const response = await instanceAxios.post<IImportResult>(
    `/api/cycles/${cycleId}/import`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return response.data
}
