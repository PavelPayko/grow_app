import type { FC } from 'react'

import { Card, Col, Row, Statistic } from 'antd'

import type { ITeamDashboardProgress } from './team-dashboard-utils'
import { formatRate } from 'components/competency-matrix/competency-matrix-utils'

interface ICycleProgressCardProps {
  progress: ITeamDashboardProgress
}

export const CycleProgressCard: FC<ICycleProgressCardProps> = ({ progress }) => (
  <Row gutter={16}>
    <Col xs={24} sm={8}>
      <Card size='small'>
        <Statistic
          title='Средняя заполненность'
          value={progress.avgFillRate !== null ? formatRate(progress.avgFillRate) : '—'}
        />
      </Card>
    </Col>
    <Col xs={24} sm={8}>
      <Card size='small'>
        <Statistic
          title='Полностью оценены'
          value={progress.fullyAssessedCount}
          suffix={`/ ${progress.memberCount}`}
        />
      </Card>
    </Col>
    <Col xs={24} sm={8}>
      <Card size='small'>
        <Statistic
          title='Заполненность < 50%'
          value={progress.lowFillCount}
          suffix={`/ ${progress.memberCount}`}
        />
      </Card>
    </Col>
  </Row>
)
