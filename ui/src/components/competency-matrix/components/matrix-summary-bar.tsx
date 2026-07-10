import type { FC } from 'react'

import { Flex, Statistic, Typography } from 'antd'

import type { IUserAggregates } from 'core/types/competency'
import { USER_GRADE_LABELS } from 'core/types/user'

import { formatRate, formatScore } from '../competency-matrix-utils'

interface MatrixSummaryBarProps {
  aggregates: IUserAggregates
}

export const MatrixSummaryBar: FC<MatrixSummaryBarProps> = ({ aggregates }) => (
  <Flex gap={24} wrap='wrap'>
    <Statistic
      title='Грейд'
      value={USER_GRADE_LABELS[aggregates.grade]}
      valueStyle={{ fontSize: 18 }}
    />
    <Statistic
      title='Взвешенный итог'
      value={formatScore(aggregates.weighted_total)}
      suffix='/ 3'
      valueStyle={{ fontSize: 18 }}
    />
    <Statistic
      title='Заполненность'
      value={formatRate(aggregates.fill_rate)}
      valueStyle={{ fontSize: 18 }}
    />
    <Typography.Text type='secondary' style={{ alignSelf: 'flex-end' }}>
      Оценено {aggregates.scored_count} из {aggregates.total_count}
    </Typography.Text>
  </Flex>
)
