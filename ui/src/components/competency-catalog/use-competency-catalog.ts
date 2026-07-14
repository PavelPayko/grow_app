import { useState } from 'react'

import { message } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cloneCatalogById,
  createBlock,
  createCatalog,
  createCompetency,
  createDomain,
  deleteBlock,
  deleteCatalog,
  deleteCompetency,
  deleteDomain,
  deleteGradeTarget,
  fetchCatalog,
  fetchCatalogs,
  updateBlock,
  updateCatalog,
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
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null)

  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [editCatalogModalOpen, setEditCatalogModalOpen] = useState(false)
  const [cloneModalOpen, setCloneModalOpen] = useState(false)
  const [blockModal, setBlockModal] = useState<BlockModalState>(null)
  const [domainModal, setDomainModal] = useState<DomainModalState>(null)
  const [competencyModal, setCompetencyModal] = useState<CompetencyModalState>(null)
  const [gradeTargetModal, setGradeTargetModal] = useState<GradeTargetModalState>(null)

  const { data: catalogs = [], isLoading: catalogsLoading } = useQuery({
    queryKey: ['catalogs'],
    queryFn: fetchCatalogs,
  })

  const activeCatalogId = selectedCatalogId || catalogs[0]?.id || null

  const {
    data: catalogData,
    isLoading: catalogLoading,
    isFetching: catalogFetching,
  } = useQuery({
    queryKey: ['catalog', activeCatalogId],
    queryFn: () => fetchCatalog(activeCatalogId!),
    enabled: Boolean(activeCatalogId),
  })

  const invalidateCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ['catalog', activeCatalogId] })
    queryClient.invalidateQueries({ queryKey: ['catalogs'] })
  }

  const createCatalogMutation = useMutation({
    mutationFn: (values: ICatalogFormValues) => createCatalog(values),
    onSuccess: (newCatalog) => {
      message.success('Каталог создан')
      setCatalogModalOpen(false)
      setSelectedCatalogId(newCatalog.id)
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const updateCatalogMutation = useMutation({
    mutationFn: (values: ICatalogFormValues) =>
      updateCatalog(activeCatalogId!, values),
    onSuccess: () => {
      message.success('Каталог переименован')
      setEditCatalogModalOpen(false)
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const cloneCatalogMutation = useMutation({
    mutationFn: (values: ICloneCatalogFormValues) =>
      cloneCatalogById(activeCatalogId!, {
        name: values.name?.trim() || undefined,
      }),
    onSuccess: (newCatalog) => {
      message.success('Каталог скопирован')
      setCloneModalOpen(false)
      setSelectedCatalogId(newCatalog.id)
      invalidateCatalog()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const deleteCatalogMutation = useMutation({
    mutationFn: () => deleteCatalog(activeCatalogId!),
    onSuccess: () => {
      message.success('Каталог удалён')
      const remaining = catalogs.filter((item) => item.id !== activeCatalogId)
      setSelectedCatalogId(remaining[0]?.id ?? null)
      queryClient.invalidateQueries({ queryKey: ['catalogs'] })
      if (activeCatalogId) {
        queryClient.removeQueries({ queryKey: ['catalog', activeCatalogId] })
      }
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

  const gradeTargetBlock = gradeTargetModal
    ? blocks.find((block) => block.id === gradeTargetModal.blockId)
    : undefined

  const gradeTargetOptions = USER_GRADES.filter(
    (grade) =>
      grade === gradeTargetModal?.target?.grade ||
      !gradeTargetBlock?.grade_targets?.some((item) => item.grade === grade)
  ).map((grade) => ({ value: grade, label: USER_GRADE_LABELS[grade] }))

  const isBusy =
    catalogsLoading ||
    catalogLoading ||
    catalogFetching ||
    createCatalogMutation.isPending ||
    updateCatalogMutation.isPending ||
    cloneCatalogMutation.isPending ||
    deleteCatalogMutation.isPending ||
    blockMutation.isPending ||
    domainMutation.isPending ||
    competencyMutation.isPending ||
    gradeTargetMutation.isPending

  return {
    catalogs,
    catalogsLoading,
    activeCatalogId,
    setSelectedCatalogId,
    catalog: catalog as ICompetencyCatalog | null,
    blocks,
    isBusy,
    catalogModalOpen,
    setCatalogModalOpen,
    editCatalogModalOpen,
    setEditCatalogModalOpen,
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
    updateCatalogMutation,
    cloneCatalogMutation,
    deleteCatalogMutation,
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
