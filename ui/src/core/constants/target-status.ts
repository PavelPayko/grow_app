import type { ITargetStatus } from 'core/types/competency'

/** Ниже target — предупреждение */
export const TARGET_STATUS_BELOW_COLOR = '#faad14'

/** Выше target — позитивный рост */
export const TARGET_STATUS_ABOVE_COLOR = '#52c41a'

/** Нет данных / нет target */
export const TARGET_STATUS_NO_DATA_COLOR = '#d9d9d9'

export const TARGET_STATUS_LABELS: Record<NonNullable<ITargetStatus>, string> = {
  below: 'Ниже target',
  in_range: 'В target',
  above: 'Выше target',
}

export function getTargetStatusColor(
  status: ITargetStatus,
  colorPrimary: string
): string {
  if (!status) return TARGET_STATUS_NO_DATA_COLOR
  if (status === 'below') return TARGET_STATUS_BELOW_COLOR
  if (status === 'in_range') return colorPrimary
  return TARGET_STATUS_ABOVE_COLOR
}
