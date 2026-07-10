import type { FC } from 'react'

import { Button, Flex, Popconfirm, Space, Table, Typography, type TableProps } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'

import type { ICompetencyBlock, IGradeTarget } from 'core/types/competency'
import { USER_GRADES, USER_GRADE_LABELS } from 'core/types/user'

interface GradeTargetsSectionProps {
  block: ICompetencyBlock
  onAdd: (blockId: string) => void
  onEdit: (blockId: string, target: IGradeTarget) => void
  onDelete: (targetId: string) => void
}

export const GradeTargetsSection: FC<GradeTargetsSectionProps> = ({
  block,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const targets = block.grade_targets || []
  const configuredGrades = new Set(targets.map((item) => item.grade))
  const canAddTarget = USER_GRADES.some((grade) => !configuredGrades.has(grade))

  const columns: TableProps<IGradeTarget>['columns'] = [
    {
      title: 'Грейд',
      dataIndex: 'grade',
      key: 'grade',
      width: 120,
      render: (grade: IGradeTarget['grade']) => USER_GRADE_LABELS[grade],
    },
    { title: 'Min', dataIndex: 'min_score', key: 'min_score', width: 80 },
    { title: 'Max', dataIndex: 'max_score', key: 'max_score', width: 80 },
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
            onClick={() => onEdit(block.id, record)}
          >
            Изменить
          </Button>
          <Popconfirm
            title='Удалить target для этого грейда?'
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
    <Flex vertical gap={8} style={{ marginBottom: 16 }}>
      <Flex justify='space-between' align='center'>
        <Typography.Text type='secondary'>Целевые диапазоны по грейдам</Typography.Text>
        <Button
          type='link'
          size='small'
          icon={<PlusOutlined />}
          disabled={!canAddTarget}
          onClick={() => onAdd(block.id)}
        >
          Добавить target
        </Button>
      </Flex>
      <Table
        rowKey='id'
        size='small'
        pagination={false}
        columns={columns}
        dataSource={targets}
        locale={{ emptyText: 'Target-диапазоны не заданы' }}
      />
    </Flex>
  )
}
