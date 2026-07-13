import type { ICycleStatus } from 'core/types/competency'

import type { Dayjs } from 'dayjs'

export interface IAssessmentCyclesAdminProps {
  className?: string
}

export interface ICreateCycleFormValues {
  name: string
  start_date?: Dayjs | null
  end_date?: Dayjs | null
}

export const CYCLE_STATUS_LABELS: Record<ICycleStatus, string> = {
  draft: 'Черновик',
  active: 'Активный',
  closed: 'Закрыт',
}

export const CYCLE_STATUS_COLORS: Record<ICycleStatus, string> = {
  draft: 'default',
  active: 'processing',
  closed: 'success',
}
