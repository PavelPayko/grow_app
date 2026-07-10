import { useState } from 'react'

import { message } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchTeams } from 'core/api/teams-api'
import {
  cloneCatalog,
  createBlock,
  createCompetency,
  createDomain,
  createTeamCatalog,
  deleteBlock,
  deleteCompetency,
  deleteDomain,
  deleteGradeTarget,
  fetchTeamCatalog,
  updateBlock,
  updateCompetency,
  updateDomain,
  upsertGradeTarget,
} from 'core/api/competency-catalog-api'
import type { ICompetencyCatalog } from 'core/types/competency'
import { USER_GRADES, USER_GRADE_LABELS } from 'core/types/user'

import { getApiError } from './competency-catalog-utils'
import type {
  BlockModalState,
  CompetencyModalState,
  DomainModalState,
  GradeTargetModalState,
  IBlockFormValues,
  ICatalogFormValues,
  ICloneCatalogFormValues,
  ICompetencyFormValues,
  IDomainFormValues,
  IGradeTargetFormValues,
} from './competency-catalog-types'

export function useCompetencyCatalog() {
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [cloneModalOpen, setCloneModalOpen] = useState(false)
  const [blockModal, setBlockModal] = useState<BlockModalState>(null)
  const [domainModal, setDomainModal] = useState<DomainModalState>(null)
  const [competencyModal, setCompetencyModal] = useState<CompetencyModalState>(null)
  const [gradeTargetModal, setGradeTargetModal] = useState<GradeTargetModalState>(null)

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  })

  const activeTeamId = selectedTeamId || teams[0]?.id || null

  const {
    data: catalogData,
    isLoading: catalogLoading,
    isFetching: catalogFetching,
  } = useQuery({
    queryKey: ['teamCatalog', activeTeamId],
    queryFn: () => fetchTeamCatalog(activeTeamId!),
    enabled: Boolean(activeTeamId),
  })

  const invalidateCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ['teamCatalog', activeTeamId] })
  }

  const createCatalogMutation = useMutation({
    mutationFn: (values: ICatalogFormValues) => createTeamCatalog(activeTeamId!, values),
    onSuccess: () => {
      message.success('Каталог создан')
      setCatalogModalOpen(false)
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const cloneCatalogMutation = useMutation({
    mutationFn: (values: ICloneCatalogFormValues) =>
      cloneCatalog({
        source_team_id: values.source_team_id,
        target_team_id: activeTeamId!,
        name: values.name?.trim() || undefined,
      }),
    onSuccess: () => {
      message.success('Каталог склонирован')
      setCloneModalOpen(false)
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const blockMutation = useMutation({
    mutationFn: async (values: IBlockFormValues) => {
      if (!catalogData?.catalog) {
        throw new Error('Каталог не найден')
      }
      if (blockModal?.mode === 'edit' && blockModal.block) {
        return updateBlock(blockModal.block.id, values)
      }
      return createBlock(catalogData.catalog.id, values)
    },
    onSuccess: () => {
      message.success(blockModal?.mode === 'edit' ? 'Блок обновлён' : 'Блок создан')
      setBlockModal(null)
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const domainMutation = useMutation({
    mutationFn: async (values: IDomainFormValues) => {
      if (domainModal?.mode === 'edit' && domainModal.domain) {
        return updateDomain(domainModal.domain.id, values)
      }
      return createDomain(domainModal!.blockId, values)
    },
    onSuccess: () => {
      message.success(domainModal?.mode === 'edit' ? 'Домен обновлён' : 'Домен создан')
      setDomainModal(null)
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const competencyMutation = useMutation({
    mutationFn: async (values: ICompetencyFormValues) => {
      if (competencyModal?.mode === 'edit' && competencyModal.competency) {
        return updateCompetency(competencyModal.competency.id, values)
      }
      return createCompetency(competencyModal!.domainId, values)
    },
    onSuccess: () => {
      message.success(
        competencyModal?.mode === 'edit' ? 'Компетенция обновлена' : 'Компетенция создана'
      )
      setCompetencyModal(null)
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const deleteBlockMutation = useMutation({
    mutationFn: deleteBlock,
    onSuccess: () => {
      message.success('Блок удалён')
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const deleteDomainMutation = useMutation({
    mutationFn: deleteDomain,
    onSuccess: () => {
      message.success('Домен удалён')
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const deleteCompetencyMutation = useMutation({
    mutationFn: deleteCompetency,
    onSuccess: () => {
      message.success('Компетенция удалена')
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const gradeTargetMutation = useMutation({
    mutationFn: async (values: IGradeTargetFormValues) =>
      upsertGradeTarget(gradeTargetModal!.blockId, values),
    onSuccess: () => {
      message.success(gradeTargetModal?.target ? 'Target обновлён' : 'Target добавлен')
      setGradeTargetModal(null)
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const deleteGradeTargetMutation = useMutation({
    mutationFn: deleteGradeTarget,
    onSuccess: () => {
      message.success('Target удалён')
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const catalog = catalogData?.catalog ?? null
  const blocks = catalogData?.blocks ?? []
  const sourceTeamOptions = teams
    .filter((team) => team.id !== activeTeamId)
    .map((team) => ({ value: team.id, label: team.name }))

  const gradeTargetBlock = gradeTargetModal
    ? blocks.find((block) => block.id === gradeTargetModal.blockId)
    : undefined

  const gradeTargetOptions = USER_GRADES.filter(
    (grade) =>
      grade === gradeTargetModal?.target?.grade ||
      !gradeTargetBlock?.grade_targets?.some((item) => item.grade === grade)
  ).map((grade) => ({ value: grade, label: USER_GRADE_LABELS[grade] }))

  const isBusy =
    catalogLoading ||
    catalogFetching ||
    createCatalogMutation.isPending ||
    cloneCatalogMutation.isPending ||
    blockMutation.isPending ||
    domainMutation.isPending ||
    competencyMutation.isPending ||
    gradeTargetMutation.isPending

  return {
    teams,
    teamsLoading,
    activeTeamId,
    setSelectedTeamId,
    catalog: catalog as ICompetencyCatalog | null,
    blocks,
    sourceTeamOptions,
    isBusy,
    catalogModalOpen,
    setCatalogModalOpen,
    cloneModalOpen,
    setCloneModalOpen,
    blockModal,
    setBlockModal,
    domainModal,
    setDomainModal,
    competencyModal,
    setCompetencyModal,
    gradeTargetModal,
    setGradeTargetModal,
    gradeTargetOptions,
    createCatalogMutation,
    cloneCatalogMutation,
    blockMutation,
    domainMutation,
    competencyMutation,
    gradeTargetMutation,
    deleteBlockMutation,
    deleteDomainMutation,
    deleteCompetencyMutation,
    deleteGradeTargetMutation,
  }
}

export type CompetencyCatalogController = ReturnType<typeof useCompetencyCatalog>
