import type { FC } from 'react'

import { Button, Flex, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

import { CatalogBlocksCollapse } from './catalog-blocks-collapse'
import type { CatalogTreeActions } from '../catalog-tree-actions'
import type { ICompetencyBlock } from 'core/types/competency'

interface CatalogBlocksViewProps extends CatalogTreeActions {
  blocks: ICompetencyBlock[]
  onAddBlock: () => void
}

export const CatalogBlocksView: FC<CatalogBlocksViewProps> = ({
  blocks,
  onAddBlock,
  ...treeActions
}) => (
  <Flex vertical gap={12}>
    <Flex justify='space-between' align='center'>
      <Typography.Title level={5} style={{ margin: 0 }}>
        Блоки компетенций
      </Typography.Title>
      <Button type='primary' icon={<PlusOutlined />} onClick={onAddBlock}>
        Добавить блок
      </Button>
    </Flex>
    <CatalogBlocksCollapse blocks={blocks} {...treeActions} />
  </Flex>
)
