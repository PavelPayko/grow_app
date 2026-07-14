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
import { useCurrentUser } from 'core/hooks/use-current-user'
import type { IAssessmentUpsertPayload } from 'core/types/competency'
import type { IUser } from 'core/types/user'

import { getApiError } from './competency-matrix-utils'

function resolveViewedUser(
  userId: string,
  users: IUser[] | undefined,
  currentUser: IUser | null,
  isManager: boolean,
): IUser | null {
  if (isManager) {
    return users?.find((user) => user.id === userId) ?? null
  }
  if (currentUser?.id === userId) {
    return currentUser
  }
  return null
}

export function useCompetencyMatrix(userId: string) {
  const queryClient = useQueryClient()
  const { user, isAdmin, isLead, canManageTeam } = useCurrentUser()
  const isManager = isAdmin || isLead

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isManager,
  })

  const viewedUser = resolveViewedUser(userId, users, user ?? null, isManager)
  const teamId = viewedUser?.team_id ?? null

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    enabled: isManager && Boolean(teamId),
  })

  const team = teams.find((item) => item.id === teamId) ?? null

  const { data: teamCatalog, isLoading: teamCatalogLoading } = useQuery({
    queryKey: ['teamCatalog', teamId],
    queryFn: () => fetchTeamCatalog(teamId!),
    enabled: !isManager && Boolean(teamId),
    select: (data) => data.catalog,
  })

  const hasTeamCatalog = isManager ? Boolean(team?.catalog_id) : Boolean(teamCatalog)
  const teamCatalogCheckLoading = isManager ? teamsLoading : teamCatalogLoading

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

  const targetTeamId = viewedUser?.team_id ?? null

  const canAssess =
    isAdmin ||
    (isLead && targetTeamId !== null && canManageTeam(targetTeamId))

  const canEdit = canAssess && matrix?.cycle.status === 'active'
  const isReadOnly = !canEdit

  return {
    isAdmin,
    isLead,
    isManager,
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
