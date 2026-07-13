import type { FC } from 'react'

import { Divider, Flex, Result, Spin, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'

import { fetchUserAggregates } from 'core/api/competency-assessment-api'
import { fetchActiveTeamCycle } from 'core/api/competency-assessment-api'
import { fetchUserCycleHistory } from 'core/api/users-api'
import { useCurrentUser } from 'core/hooks/use-current-user'

import { CompetencySection } from './competency-section'
import { IprSection } from './ipr-section'
import { ManagerInsightPanel } from './manager-insight-panel'
import { useEmployeeDashboardAccess } from './use-employee-dashboard-access'
import type { IUserDashboardProps } from './user-dashboard-types'

export const UserDashboardComponent: FC<IUserDashboardProps> = ({ userId }) => {
  const { isAdmin, isLead } = useCurrentUser()
  const { allowed, targetUser, isLoading } = useEmployeeDashboardAccess(userId)

  const { data: activeCycle } = useQuery({
    queryKey: ['activeTeamCycle', targetUser?.team_id],
    queryFn: () => fetchActiveTeamCycle(targetUser!.team_id!),
    enabled: !!targetUser?.team_id && allowed,
  })

  const { data: aggregates } = useQuery({
    queryKey: ['userAggregates', activeCycle?.id, userId],
    queryFn: () => fetchUserAggregates(activeCycle!.id, userId),
    enabled: !!activeCycle?.id && allowed,
  })

  const { data: history = [] } = useQuery({
    queryKey: ['userCycleHistory', userId],
    queryFn: () => fetchUserCycleHistory(userId),
    enabled: allowed,
  })

  if (isLoading) {
    return <Spin />
  }

  if (!allowed) {
    return (
      <Result
        status='403'
        title='Нет доступа'
        subTitle='Вы не можете просматривать дашборд этого сотрудника'
      />
    )
  }

  const showManagerInsight = isAdmin || isLead

  return (
    <Flex vertical gap={24}>
      <Flex vertical gap={12}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          ИПР
        </Typography.Title>
        <IprSection userId={userId} />
      </Flex>

      <Divider />

      <Flex vertical gap={12}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Компетенции
        </Typography.Title>
        <CompetencySection userId={userId} teamId={targetUser?.team_id} />
      </Flex>

      {showManagerInsight && (
        <ManagerInsightPanel aggregates={aggregates ?? null} history={history} />
      )}
    </Flex>
  )
}
