import type { FC } from 'react'

import { Select, Space, Tag, Typography } from 'antd'

import type { IAssessmentCycle } from 'core/types/competency'

import { CYCLE_STATUS_LABELS } from '../competency-matrix-constants'

interface MatrixCycleSelectorProps {
  cycles: IAssessmentCycle[]
  loading: boolean
  value: string | null
  onChange: (cycleId: string) => void
}

export const MatrixCycleSelector: FC<MatrixCycleSelectorProps> = ({
  cycles,
  loading,
  value,
  onChange,
}) => (
  <Space align='center' wrap>
    <Typography.Text strong>Цикл оценки:</Typography.Text>
    <Select
      style={{ minWidth: 280 }}
      loading={loading}
      value={value}
      onChange={onChange}
      placeholder='Выберите цикл'
      options={cycles.map((cycle) => ({
        value: cycle.id,
        label: (
          <Space>
            <span>{cycle.name}</span>
            <Tag>{CYCLE_STATUS_LABELS[cycle.status]}</Tag>
          </Space>
        ),
      }))}
    />
  </Space>
)
