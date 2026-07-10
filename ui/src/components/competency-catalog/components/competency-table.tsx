import type { FC } from 'react'

import { Button, Popconfirm, Space, Table, type TableProps } from 'antd'
import { EditOutlined } from '@ant-design/icons'

import type { ICompetency } from 'core/types/competency'

interface CompetencyTableProps {
  competencies: ICompetency[]
  onEdit: (competency: ICompetency) => void
  onDelete: (competencyId: string) => void
}

export const CompetencyTable: FC<CompetencyTableProps> = ({
  competencies,
  onEdit,
  onDelete,
}) => {
  const columns: TableProps<ICompetency>['columns'] = [
    { title: 'Компетенция', dataIndex: 'name', key: 'name' },
    { title: 'Вес', dataIndex: 'weight', key: 'weight', width: 80 },
    {
      title: 'Критерий уровня',
      dataIndex: 'level_criterion',
      key: 'level_criterion',
      ellipsis: true,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type='link'
            size='small'
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Изменить
          </Button>
          <Popconfirm
            title='Удалить компетенцию?'
            okText='Удалить'
            onConfirm={() => onDelete(record.id)}
          >
            <Button type='link' size='small' danger>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Table
      rowKey='id'
      size='small'
      pagination={false}
      columns={columns}
      dataSource={competencies}
      locale={{ emptyText: 'Нет компетенций' }}
    />
  )
}
