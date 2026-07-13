import type { FC } from 'react'

import { Card, Col, Row, Statistic, Typography } from 'antd'

import type { IUserAggregates } from 'core/types/competency'
import type { IUserCycleHistoryEntry } from 'core/types/competency'
import { formatScore } from 'components/competency-matrix/competency-matrix-utils'
import { TARGET_STATUS_META } from 'components/competency-matrix/competency-matrix-constants'

import { computeCycleDelta, computeTargetSummary } from './user-dashboard-utils'

interface IManagerInsightPanelProps {
  aggregates: IUserAggregates | null
  history: IUserCycleHistoryEntry[]
}

export const ManagerInsightPanel: FC<IManagerInsightPanelProps> = ({
  aggregates,
  history,
}) => {
  const delta = computeCycleDelta(history)
  const targetSummary = aggregates
    ? computeTargetSummary(aggregates.blocks)
    : { below: 0, in_range: 0, above: 0 }

  return (
    <Card title='Insight для руководителя' size='small'>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Statistic
            title='Δ итога к прошлому циклу'
            value={delta !== null ? formatScore(delta) : '—'}
            prefix={delta !== null && delta > 0 ? '+' : undefined}
          />
        </Col>
        <Col xs={24} sm={16}>
          <Typography.Text type='secondary'>Блоки по target:</Typography.Text>
          <div style={{ marginTop: 8 }}>
            {(Object.entries(targetSummary) as Array<[keyof typeof targetSummary, number]>)
              .map(([status, count]) => (
                <Typography.Text key={status} style={{ marginRight: 16 }}>
                  {TARGET_STATUS_META[status].label}: {count}
                </Typography.Text>
              ))}
          </div>
        </Col>
      </Row>
    </Card>
  )
}
