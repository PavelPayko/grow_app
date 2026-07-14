import type { IOrgCycleStatus } from 'core/types/competency'

import {
  CYCLE_STATUS_COLORS,
  CYCLE_STATUS_LABELS,
} from 'components/assessment-cycles-admin/assessment-cycles-admin-types'

export interface IOrgDashboardProps {
  className?: string
}

export const ORG_CYCLE_STATUS_LABELS: Record<IOrgCycleStatus, string> = {
  ...CYCLE_STATUS_LABELS,
  not_started: 'Не начат',
}

export const ORG_CYCLE_STATUS_COLORS: Record<IOrgCycleStatus, string> = {
  ...CYCLE_STATUS_COLORS,
  not_started: 'default',
}
