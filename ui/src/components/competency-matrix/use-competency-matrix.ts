import { useEffect, useState } from 'react'

import { message } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchActiveTeamCycle,
  fetchTeamCycles,
  fetchUserMatrix,
  upsertUserAssessment,
} from 'core/api/competency-assessment-api'
import { fetchTeamCatalog } from 'core/api/competency-catalog-api'
import { fetchTeams } from 'core/api/teams-api'
import { fetchUsers } from 'core/api/users-api'
import type { IAssessmentUpsertPayload } from 'core/types/competency'
import type { IUser } from 'core/types/user'

import { getApiError, getStoredUser } from './competency-matrix-utils'

function resolveViewedUser(userId: string, users: IUser[] | undefined): IUser | null {
  const storedUser = getStoredUser()
  if (storedUser?.role === 'admin') {
    return users?.find((user) => user.id === userId) ?? null
  }
  if (storedUser?.id === userId) {
    return storedUser
  }
  return null
}

export function useCompetencyMatrix(userId: string) {
  const queryClient = useQueryClient()
  const storedUser = getStoredUser()
  const isAdmin = storedUser?.role === 'admin'

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isAdmin,
  })

  // Matrix loads catalog snapshot from the selected cycle (cycle.catalog_id).
  // Team catalog binding (teams.catalog_id) is used when creating new cycles.
  const viewedUser = resolveViewedUser(userId, users)
  const teamId = viewedUser?.team_id ?? null

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    enabled: isAdmin && Boolean(teamId),
  })

  const team = teams.find((item) => item.id === teamId) ?? null

  const { data: teamCatalog, isLoading: teamCatalogLoading } = useQuery({
    queryKey: ['teamCatalog', teamId],
    queryFn: () => fetchTeamCatalog(teamId!),
    enabled: !isAdmin && Boolean(teamId),
    select: (data) => data.catalog,
  })

  const hasTeamCatalog = isAdmin ? Boolean(team?.catalog_id) : Boolean(teamCatalog)
  const teamCatalogCheckLoading = isAdmin ? teamsLoading : teamCatalogLoading

  const { data: cycles = [], isLoading: cyclesLoading } = useQuery({
    queryKey: ['teamCycles', teamId],
    queryFn: () => fetchTeamCycles(teamId!),
    enabled: Boolean(teamId),
  })

  const { data: activeCycle } = useQuery({
    queryKey: ['activeTeamCycle', teamId],
    queryFn: () => fetchActiveTeamCycle(teamId!),
    enabled: Boolean(teamId),
  })

  useEffect(() => {
    setSelectedCycleId(null)
  }, [userId, teamId])

  useEffect(() => {
    if (selectedCycleId || !cycles.length) {
      return
    }
    setSelectedCycleId(activeCycle?.id ?? cycles[0]?.id ?? null)
  }, [activeCycle?.id, cycles, selectedCycleId])

  const {
    data: matrix,
    isLoading: matrixLoading,
    isFetching: matrixFetching,
  } = useQuery({
    queryKey: ['userMatrix', selectedCycleId, userId],
    queryFn: () => fetchUserMatrix(selectedCycleId!, userId),
    enabled: Boolean(selectedCycleId && userId),
  })

  const upsertMutation = useMutation({
    mutationFn: ({
      competencyId,
      payload,
    }: {
      competencyId: string
      payload: IAssessmentUpsertPayload
    }) => upsertUserAssessment(selectedCycleId!, userId, competencyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMatrix', selectedCycleId, userId] })
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const canEdit = isAdmin && matrix?.cycle.status === 'active'
  const isReadOnly = !canEdit

  return {
    isAdmin,
    viewedUser,
    teamId,
    hasTeamCatalog,
    teamCatalogCheckLoading,
    cycles,
    cyclesLoading,
    activeCycle,
    selectedCycleId,
    setSelectedCycleId,
    matrix,
    matrixLoading,
    matrixFetching,
    canEdit,
    isReadOnly,
    upsertMutation,
  }
}

export type CompetencyMatrixController = ReturnType<typeof useCompetencyMatrix>
