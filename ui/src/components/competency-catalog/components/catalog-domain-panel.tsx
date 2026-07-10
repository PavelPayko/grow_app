import { Button, Flex, Popconfirm, Space, Typography } from 'antd'
import type { CollapseProps } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'

import type { ICompetency, ICompetencyDomain } from 'core/types/competency'

import { CompetencyTable } from './competency-table'

interface BuildDomainCollapseItemProps {
  blockId: string
  domain: ICompetencyDomain
  onCreateCompetency: (domainId: string) => void
  onEditDomain: (blockId: string, domain: ICompetencyDomain) => void
  onDeleteDomain: (domainId: string) => void
  onEditCompetency: (competency: ICompetency) => void
  onDeleteCompetency: (competencyId: string) => void
}

export function buildDomainCollapseItem({
  blockId,
  domain,
  onCreateCompetency,
  onEditDomain,
  onDeleteDomain,
  onEditCompetency,
  onDeleteCompetency,
}: BuildDomainCollapseItemProps): NonNullable<CollapseProps['items']>[number] {
  return {
    key: domain.id,
    label: (
      <Flex justify='space-between' align='center' style={{ width: '100%' }}>
        <Typography.Text strong>{domain.name}</Typography.Text>
        <Space onClick={(event) => event.stopPropagation()}>
          <Button
            type='link'
            size='small'
            icon={<PlusOutlined />}
            onClick={() => onCreateCompetency(domain.id)}
          >
            Компетенция
          </Button>
          <Button
            type='link'
            size='small'
            icon={<EditOutlined />}
            onClick={() => onEditDomain(blockId, domain)}
          >
            Изменить
          </Button>
          <Popconfirm
            title='Удалить домен и все компетенции?'
            okText='Удалить'
            onConfirm={() => onDeleteDomain(domain.id)}
          >
            <Button type='link' size='small' danger>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      </Flex>
    ),
    children: (
      <CompetencyTable
        competencies={domain.competencies || []}
        onEdit={onEditCompetency}
        onDelete={onDeleteCompetency}
      />
    ),
  }
}
