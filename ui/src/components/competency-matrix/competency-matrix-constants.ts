import type { ITargetStatus } from 'core/types/competency'
import { TARGET_STATUS_LABELS } from 'core/constants/target-status'

export interface ITargetStatusMeta {
  label: string
}

export const TARGET_STATUS_META: Record<NonNullable<ITargetStatus>, ITargetStatusMeta> = {
  below: { label: TARGET_STATUS_LABELS.below },
  in_range: { label: TARGET_STATUS_LABELS.in_range },
  above: { label: TARGET_STATUS_LABELS.above },
}

export const CYCLE_STATUS_LABELS = {
  draft: 'Черновик',
  active: 'Активный',
  closed: 'Закрыт',
} as const

export const SCORE_OPTIONS = [
  { value: null as number | null, label: '—' },
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
]
