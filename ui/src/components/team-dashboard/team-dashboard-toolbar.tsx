import type { FC } from 'react'

import { Select } from 'antd'
import type { SelectProps } from 'antd'

import type { IAssessmentCycle } from 'core/types/competency'
import { CYCLE_STATUS_LABELS } from 'components/competency-matrix/competency-matrix-constants'

interface ITeamDashboardToolbarProps {
  cycles: IAssessmentCycle[]
  cycleId: string | null
  onCycleChange: (cycleId: string) => void
  loading?: boolean
}

export const TeamDashboardToolbar: FC<ITeamDashboardToolbarProps> = ({
  cycles,
  cycleId,
  onCycleChange,
  loading,
}) => {
  const options: SelectProps['options'] = cycles.map((cycle) => ({
    value: cycle.id,
    label: `${cycle.name} (${CYCLE_STATUS_LABELS[cycle.status]})`,
  }))

  return (
    <Select
      style={{ minWidth: 280 }}
      placeholder='Выберите цикл оценки'
      value={cycleId ?? undefined}
      onChange={onCycleChange}
      options={options}
      loading={loading}
      disabled={!cycles.length}
    />
  )
}
