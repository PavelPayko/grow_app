import type { FC } from 'react'

import { Button, Empty } from 'antd'

interface CatalogEmptyStateProps {
  onCreateCatalog: () => void
}

export const CatalogEmptyState: FC<CatalogEmptyStateProps> = ({ onCreateCatalog }) => (
  <Empty description='Каталоги компетенций ещё не созданы'>
    <Button type='primary' onClick={onCreateCatalog}>
      Создать каталог
    </Button>
  </Empty>
)
