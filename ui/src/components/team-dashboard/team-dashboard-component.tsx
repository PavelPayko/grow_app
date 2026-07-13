import { useMemo, useState, type FC } from 'react'

import { Alert, Empty, Flex, Spin, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'

import { fetchUsers } from 'core/api/users-api'
import {
  fetchActiveTeamCycle,
  fetchTeamAggregates,
  fetchTeamCycles,
} from 'core/api/team-dashboard-api'

import { CycleProgressCard } from './cycle-progress-card'
import { TeamBlockHeatmap } from './team-block-heatmap'
import { TeamSummaryTable } from './team-summary-table'
import { TeamDashboardToolbar } from './team-dashboard-toolbar'
import type { ITeamDashboardProps } from './team-dashboard-types'
import {
  buildTeamDashboardProgress,
  buildTeamDashboardRows,
  extractHeatmapBlocks,
} from './team-dashboard-utils'

export const TeamDashboardComponent: FC<ITeamDashboardProps> = ({
  teamId,
  onSelectUser,
}) => {
  const [manualCycleId, setManualCycleId] = useState<string | null>(null)
  const [cycleTeamId, setCycleTeamId] = useState(teamId)

  if (teamId !== cycleTeamId) {
    setCycleTeamId(teamId)
    setManualCycleId(null)
  }

  const { data: cycles = [], isLoading: cyclesLoading } = useQuery({
    queryKey: ['teamCycles', teamId],
    queryFn: () => fetchTeamCycles(teamId!),
    enabled: !!teamId,
  })

  const { data: activeCycle } = useQuery({
    queryKey: ['activeTeamCycle', teamId],
    queryFn: () => fetchActiveTeamCycle(teamId!),
    enabled: !!teamId,
  })

  const defaultCycleId = useMemo(() => {
    if (!cycles.length) return null
    return activeCycle?.id ?? cycles[0].id
  }, [activeCycle?.id, cycles])

  const cycleId = manualCycleId ?? defaultCycleId

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: !!teamId,
  })

  const {
    data: aggregates = [],
    isLoading: aggregatesLoading,
    isError: aggregatesError,
  } = useQuery({
    queryKey: ['teamAggregates', cycleId],
    queryFn: () => fetchTeamAggregates(cycleId!),
    enabled: !!cycleId,
  })

  const tableRows = useMemo(
    () => buildTeamDashboardRows(aggregates, users),
    [aggregates, users]
  )

  const progress = useMemo(
    () => buildTeamDashboardProgress(aggregates),
    [aggregates]
  )

  const heatmapBlocks = useMemo(
    () => extractHeatmapBlocks(aggregates),
    [aggregates]
  )

  if (!teamId) {
    return <Empty description='Выберите команду' />
  }

  if (cyclesLoading) {
    return (
      <Flex justify='center' style={{ padding: 48 }}>
        <Spin />
      </Flex>
    )
  }

  if (!cycles.length) {
    return <Empty description='У команды нет циклов оценки' />
  }

  const loading = aggregatesLoading

  return (
    <Flex vertical gap={24}>
      <TeamDashboardToolbar
        cycles={cycles}
        cycleId={cycleId}
        onCycleChange={setManualCycleId}
        loading={cyclesLoading}
      />

      {aggregatesError && (
        <Alert type='error' message='Не удалось загрузить агрегаты команды' showIcon />
      )}

      {loading ? (
        <Flex justify='center' style={{ padding: 48 }}>
          <Spin />
        </Flex>
      ) : (
        <>
          <CycleProgressCard progress={progress} />

          <Flex vertical gap={8}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Heatmap по блокам
            </Typography.Title>
            <TeamBlockHeatmap
              rows={tableRows}
              blocks={heatmapBlocks}
              onSelectUser={onSelectUser}
            />
          </Flex>

          <Flex vertical gap={8}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Сводка по команде
            </Typography.Title>
            <TeamSummaryTable
              rows={tableRows}
              onSelectUser={onSelectUser}
            />
          </Flex>
        </>
      )}
    </Flex>
  )
}
