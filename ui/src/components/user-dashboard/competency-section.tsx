import type { FC } from 'react'

import { Empty, Flex, Spin, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'

import {
  fetchActiveTeamCycle,
  fetchUserAggregates,
  fetchUserMatrix,
} from 'core/api/competency-assessment-api'
import { fetchUserCycleHistory } from 'core/api/users-api'

import { BlockTargetChart } from './block-target-chart'
import { CycleHistoryChart } from './cycle-history-chart'
import { DevelopmentZonesList } from './development-zones-list'
import { extractDevelopmentZones } from './user-dashboard-utils'

interface ICompetencySectionProps {
  userId: string
  teamId: string | null | undefined
}

export const CompetencySection: FC<ICompetencySectionProps> = ({ userId, teamId }) => {
  const { data: activeCycle, isLoading: cycleLoading } = useQuery({
    queryKey: ['activeTeamCycle', teamId],
    queryFn: () => fetchActiveTeamCycle(teamId!),
    enabled: !!teamId,
  })

  const { data: aggregates, isLoading: aggregatesLoading } = useQuery({
    queryKey: ['userAggregates', activeCycle?.id, userId],
    queryFn: () => fetchUserAggregates(activeCycle!.id, userId),
    enabled: !!activeCycle?.id,
  })

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['userCycleHistory', userId],
    queryFn: () => fetchUserCycleHistory(userId),
    enabled: !!userId,
  })

  const { data: matrix, isLoading: matrixLoading } = useQuery({
    queryKey: ['userMatrix', activeCycle?.id, userId],
    queryFn: () => fetchUserMatrix(activeCycle!.id, userId),
    enabled: !!activeCycle?.id,
  })

  if (!teamId) {
    return <Empty description='Сотрудник не привязан к команде' />
  }

  if (cycleLoading) {
    return <Spin />
  }

  if (!activeCycle) {
    return <Empty description='Нет активного цикла оценки' />
  }

  const developmentZones = matrix ? extractDevelopmentZones(matrix) : []
  const loading = aggregatesLoading || historyLoading || matrixLoading

  if (loading) {
    return <Spin />
  }

  return (
    <Flex vertical gap={24}>
      <Flex vertical gap={8}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Блоки vs target ({activeCycle.name})
        </Typography.Title>
        {aggregates?.blocks.length ? (
          <BlockTargetChart blocks={aggregates.blocks} />
        ) : (
          <Empty description='Нет данных по блокам' />
        )}
      </Flex>

      <Flex vertical gap={8}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Динамика по циклам
        </Typography.Title>
        {history.length ? (
          <CycleHistoryChart history={history} />
        ) : (
          <Empty description='Нет истории циклов' />
        )}
      </Flex>

      <Flex vertical gap={8}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Зоны развития
        </Typography.Title>
        <DevelopmentZonesList zones={developmentZones} />
      </Flex>
    </Flex>
  )
}
