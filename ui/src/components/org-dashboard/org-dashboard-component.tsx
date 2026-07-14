import type { FC } from 'react'

import { Table, Tag, type TableProps } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { fetchOrgSummary } from 'core/api/org-dashboard-api'
import type { IOrgSummaryRow } from 'core/types/competency'
import { formatRate } from 'components/competency-matrix/competency-matrix-utils'
import { navigateToTeamDashboard } from 'core/utils/selected-team'

import {
  ORG_CYCLE_STATUS_COLORS,
  ORG_CYCLE_STATUS_LABELS,
  type IOrgDashboardProps,
} from './org-dashboard-types'

export const OrgDashboardComponent: FC<IOrgDashboardProps> = () => {
  const navigate = useNavigate()

  const { data: rows = [], isLoading, isFetching } = useQuery({
    queryKey: ['orgSummary'],
    queryFn: fetchOrgSummary,
    select: (data) => data || [],
  })

  const columns: TableProps<IOrgSummaryRow>['columns'] = [
    {
      title: 'Команда',
      dataIndex: 'team_name',
      key: 'team_name',
      sorter: (a, b) => a.team_name.localeCompare(b.team_name, 'ru'),
    },
    {
      title: 'Цикл',
      dataIndex: 'cycle_name',
      key: 'cycle_name',
      render: (value: string | null) => value || '—',
      sorter: (a, b) => (a.cycle_name || '').localeCompare(b.cycle_name || '', 'ru'),
    },
    {
      title: 'Статус',
      dataIndex: 'cycle_status',
      key: 'cycle_status',
      render: (status: IOrgSummaryRow['cycle_status']) => (
        <Tag color={ORG_CYCLE_STATUS_COLORS[status]}>
          {ORG_CYCLE_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: 'Заполненность',
      dataIndex: 'avg_fill_rate',
      key: 'avg_fill_rate',
      render: (value: number | null) => (value == null ? '—' : formatRate(value)),
      sorter: (a, b) => (a.avg_fill_rate ?? -1) - (b.avg_fill_rate ?? -1),
    },
    {
      title: 'Сотрудников',
      dataIndex: 'member_count',
      key: 'member_count',
      sorter: (a, b) => a.member_count - b.member_count,
    },
  ]

  return (
    <Table
      rowKey='team_id'
      columns={columns}
      dataSource={rows}
      loading={isLoading || isFetching}
      locale={{ emptyText: 'Нет данных по командам' }}
      onRow={(record) => ({
        onClick: () => navigateToTeamDashboard(navigate, record.team_id),
        style: { cursor: 'pointer' },
      })}
    />
  )
}
