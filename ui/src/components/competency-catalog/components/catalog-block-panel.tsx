import { Button, Collapse, Flex, Popconfirm, Space, Typography } from 'antd'
import type { CollapseProps } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'

import type { ICompetencyBlock } from 'core/types/competency'

import { buildDomainCollapseItem } from './catalog-domain-panel'
import type { CatalogTreeActions } from '../catalog-tree-actions'
import { GradeTargetsSection } from './grade-targets-section'

interface BuildBlockCollapseItemProps extends CatalogTreeActions {
  block: ICompetencyBlock
}

export function buildBlockCollapseItem({
  block,
  onCreateDomain,
  onEditBlock,
  onDeleteBlock,
  onCreateGradeTarget,
  onEditGradeTarget,
  onDeleteGradeTarget,
  ...domainActions
}: BuildBlockCollapseItemProps): NonNullable<CollapseProps['items']>[number] {
  return {
    key: block.id,
    label: (
      <Flex justify='space-between' align='center' style={{ width: '100%' }}>
        <Typography.Text strong>{block.name}</Typography.Text>
        <Space onClick={(event) => event.stopPropagation()}>
          <Button
            type='link'
            size='small'
            icon={<PlusOutlined />}
            onClick={() => onCreateDomain(block.id)}
          >
            Домен
          </Button>
          <Button
            type='link'
            size='small'
            icon={<EditOutlined />}
            onClick={() => onEditBlock(block)}
          >
            Изменить
          </Button>
          <Popconfirm
            title='Удалить блок и всё содержимое?'
            okText='Удалить'
            onConfirm={() => onDeleteBlock(block.id)}
          >
            <Button type='link' size='small' danger>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      </Flex>
    ),
    children: (
      <>
        <GradeTargetsSection
          block={block}
          onAdd={onCreateGradeTarget}
          onEdit={onEditGradeTarget}
          onDelete={onDeleteGradeTarget}
        />
        <Collapse
          size='small'
          items={(block.domains || []).map((domain) =>
            buildDomainCollapseItem({ blockId: block.id, domain, ...domainActions })
          )}
        />
      </>
    ),
  }
}
