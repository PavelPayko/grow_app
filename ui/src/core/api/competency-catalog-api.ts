import type {
  IBlockPayload,
  ICloneCatalogPayload,
  ICompetency,
  ICompetencyCatalog,
  ICompetencyDomain,
  ICompetencyPayload,
  ICompetencyBlock,
  ICreateCatalogPayload,
  IDomainPayload,
  IGradeTarget,
  IGradeTargetPayload,
  ITeamCatalog,
} from 'core/types/competency'
import { instanceAxios } from './axios'

export const fetchTeamCatalog = async (teamId: string): Promise<ITeamCatalog> => {
  const response = await instanceAxios.get<ITeamCatalog>(`/api/teams/${teamId}/catalog`)
  return response.data
}

export const createTeamCatalog = async (
  teamId: string,
  payload: ICreateCatalogPayload
): Promise<ICompetencyCatalog> => {
  const response = await instanceAxios.post<ICompetencyCatalog>(
    `/api/teams/${teamId}/catalogs`,
    payload
  )
  return response.data
}

export const cloneCatalog = async (
  payload: ICloneCatalogPayload
): Promise<ICompetencyCatalog> => {
  const response = await instanceAxios.post<ICompetencyCatalog>('/api/catalogs/clone', payload)
  return response.data
}

export const createBlock = async (
  catalogId: string,
  payload: IBlockPayload
): Promise<ICompetencyBlock> => {
  const response = await instanceAxios.post<ICompetencyBlock>(
    `/api/catalogs/${catalogId}/blocks`,
    payload
  )
  return response.data
}

export const updateBlock = async (
  blockId: string,
  payload: IBlockPayload
): Promise<ICompetencyBlock> => {
  const response = await instanceAxios.put<ICompetencyBlock>(`/api/blocks/${blockId}`, payload)
  return response.data
}

export const deleteBlock = async (blockId: string): Promise<void> => {
  await instanceAxios.delete(`/api/blocks/${blockId}`)
}

export const createDomain = async (
  blockId: string,
  payload: IDomainPayload
): Promise<ICompetencyDomain> => {
  const response = await instanceAxios.post<ICompetencyDomain>(
    `/api/blocks/${blockId}/domains`,
    payload
  )
  return response.data
}

export const updateDomain = async (
  domainId: string,
  payload: IDomainPayload
): Promise<ICompetencyDomain> => {
  const response = await instanceAxios.put<ICompetencyDomain>(`/api/domains/${domainId}`, payload)
  return response.data
}

export const deleteDomain = async (domainId: string): Promise<void> => {
  await instanceAxios.delete(`/api/domains/${domainId}`)
}

export const createCompetency = async (
  domainId: string,
  payload: ICompetencyPayload
): Promise<ICompetency> => {
  const response = await instanceAxios.post<ICompetency>(
    `/api/domains/${domainId}/competencies`,
    payload
  )
  return response.data
}

export const updateCompetency = async (
  competencyId: string,
  payload: ICompetencyPayload
): Promise<ICompetency> => {
  const response = await instanceAxios.put<ICompetency>(
    `/api/competencies/${competencyId}`,
    payload
  )
  return response.data
}

export const deleteCompetency = async (competencyId: string): Promise<void> => {
  await instanceAxios.delete(`/api/competencies/${competencyId}`)
}

export const upsertGradeTarget = async (
  blockId: string,
  payload: IGradeTargetPayload
): Promise<IGradeTarget> => {
  const response = await instanceAxios.put<IGradeTarget>(
    `/api/blocks/${blockId}/grade-targets`,
    payload
  )
  return response.data
}

export const deleteGradeTarget = async (gradeTargetId: string): Promise<void> => {
  await instanceAxios.delete(`/api/grade-targets/${gradeTargetId}`)
}
