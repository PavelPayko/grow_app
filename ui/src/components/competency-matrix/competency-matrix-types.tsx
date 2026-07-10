import type {
  ICompetencyBlock,
  ICompetencyDomain,
  ICompetencyWithAssessment,
  ITargetStatus,
} from 'core/types/competency'

export interface ICompetencyMatrixProps {
  userId: string
  className?: string
}

export interface IMatrixDomain extends Omit<ICompetencyDomain, 'competencies'> {
  competencies: ICompetencyWithAssessment[]
}

export interface IMatrixBlock extends Omit<ICompetencyBlock, 'domains'> {
  domains: IMatrixDomain[]
}

export interface ITargetStatusMeta {
  label: string
  color: 'success' | 'warning' | 'error' | 'default'
}

export const TARGET_STATUS_META: Record<NonNullable<ITargetStatus>, ITargetStatusMeta> = {
  below: { label: 'Ниже target', color: 'error' },
  in_range: { label: 'В target', color: 'success' },
  above: { label: 'Выше target', color: 'warning' },
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
