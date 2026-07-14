import type { FC } from 'react'
import { useMemo } from 'react'

import { Table, Tag, Typography, theme, type TableProps } from 'antd'

import { getTargetStatusColor } from 'core/constants/target-status'
import { formatScore } from 'components/competency-matrix/competency-matrix-utils'

import type { ITeamDashboardTableRow, ITeamHeatmapBlockColumn } from './team-dashboard-utils'

interface ITeamBlockHeatmapProps {
  rows: ITeamDashboardTableRow[]
  blocks: ITeamHeatmapBlockColumn[]
  onSelectUser?: (userId: string) => void
  loading?: boolean
}

function getBlockForRow(row: ITeamDashboardTableRow, blockId: string) {
  return row.blocks.find((block) => block.block_id === blockId)
}

export const TeamBlockHeatmap: FC<ITeamBlockHeatmapProps> = ({
  rows,
  blocks,
  onSelectUser,
  loading,
}) => {
  const { token } = theme.useToken()
  const colorPrimary = token.colorPrimary

  const columns: TableProps<ITeamDashboardTableRow>['columns'] = useMemo(() => {
    const blockColumns = blocks.map((block) => ({
      title: block.block_name,
      key: block.block_id,
      align: 'center' as const,
      render: (_: unknown, record: ITeamDashboardTableRow) => {
        const blockAggregate = getBlockForRow(record, block.block_id)
        const status = blockAggregate?.target?.status ?? null
        if (!status) {
          return <Typography.Text type='secondary'>—</Typography.Text>
        }
        return (
          <Tag
            color={getTargetStatusColor(status, colorPrimary)}
            title={formatScore(blockAggregate?.weighted_total ?? null)}
          >
            {formatScore(blockAggregate?.weighted_total ?? null)}
          </Tag>
        )
      },
    }))

    return [
      {
        title: 'Сотрудник',
        dataIndex: 'full_name',
        key: 'full_name',
        fixed: 'left' as const,
        width: 180,
      },
      ...blockColumns,
    ]
  }, [blocks, colorPrimary])

  return (
    <Table
      size='small'
      rowKey='user_id'
      loading={loading}
      columns={columns}
      dataSource={rows}
      pagination={false}
      scroll={{ x: true }}
      onRow={(record) => ({
        onClick: () => onSelectUser?.(record.user_id),
        style: { cursor: onSelectUser ? 'pointer' : undefined },
      })}
    />
  )
}
