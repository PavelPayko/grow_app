import type { FC } from 'react'

import { Collapse, Empty } from 'antd'
import type { CollapseProps } from 'antd'

import type { ICompetencyBlock } from 'core/types/competency'

import { buildBlockCollapseItem } from './catalog-block-panel'
import type { CatalogTreeActions } from '../catalog-tree-actions'

interface CatalogBlocksCollapseProps extends CatalogTreeActions {
  blocks: ICompetencyBlock[]
}

export const CatalogBlocksCollapse: FC<CatalogBlocksCollapseProps> = ({
  blocks,
  ...actions
}) => {
  if (!blocks.length) {
    return <Empty description='Блоки не добавлены' />
  }

  const items: CollapseProps['items'] = blocks.map((block) =>
    buildBlockCollapseItem({ block, ...actions })
  )

  return <Collapse items={items} />
}
