import { useEffect, useState } from 'react'

import { message } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchActiveTeamCycle,
  fetchTeamCycles,
  fetchUserMatrix,
  upsertUserAssessment,
} from 'core/api/competency-assessment-api'
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

  const viewedUser = resolveViewedUser(userId, users)
  const teamId = viewedUser?.team_id ?? null

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
