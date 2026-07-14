import type { FC } from 'react'

import { Table, type TableProps } from 'antd'

import { formatGradeLabel } from 'core/types/user'
import { formatRate, formatScore } from 'components/competency-matrix/competency-matrix-utils'

import type { ITeamDashboardTableRow } from './team-dashboard-utils'

interface ITeamSummaryTableProps {
  rows: ITeamDashboardTableRow[]
  loading?: boolean
  onSelectUser?: (userId: string) => void
}

export const TeamSummaryTable: FC<ITeamSummaryTableProps> = ({
  rows,
  loading,
  onSelectUser,
}) => {
  const columns: TableProps<ITeamDashboardTableRow>['columns'] = [
    {
      title: 'Имя',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: 'Должность',
      dataIndex: 'job_title',
      key: 'job_title',
      render: (value: string | null) => value || '—',
      sorter: (a, b) => (a.job_title || '').localeCompare(b.job_title || ''),
    },
    {
      title: 'Грейд',
      dataIndex: 'grade',
      key: 'grade',
      render: (value: ITeamDashboardTableRow['grade']) => formatGradeLabel(value) ?? '—',
      sorter: (a, b) =>
        (formatGradeLabel(a.grade) ?? '').localeCompare(formatGradeLabel(b.grade) ?? ''),
    },
    {
      title: 'Итог',
      dataIndex: 'weighted_total',
      key: 'weighted_total',
      render: (value: number | null) => formatScore(value),
      sorter: (a, b) => (a.weighted_total ?? -1) - (b.weighted_total ?? -1),
    },
    {
      title: 'Заполненность',
      dataIndex: 'fill_rate',
      key: 'fill_rate',
      render: (value: number | null) => formatRate(value),
      sorter: (a, b) => (a.fill_rate ?? -1) - (b.fill_rate ?? -1),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Блоков ниже target',
      dataIndex: 'blocksBelowTarget',
      key: 'blocksBelowTarget',
      sorter: (a, b) => a.blocksBelowTarget - b.blocksBelowTarget,
    },
  ]

  return (
    <Table
      size='small'
      rowKey='user_id'
      loading={loading}
      columns={columns}
      dataSource={rows}
      pagination={false}
      onRow={(record) => ({
        onClick: () => onSelectUser?.(record.user_id),
        style: { cursor: onSelectUser ? 'pointer' : undefined },
      })}
    />
  )
}
