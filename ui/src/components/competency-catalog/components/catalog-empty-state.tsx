import type { FC } from 'react'

import { Button, Empty, Space } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

interface CatalogEmptyStateProps {
  activeTeamId: string | null
  canClone: boolean
  onCreateCatalog: () => void
  onClone: () => void
}

export const CatalogEmptyState: FC<CatalogEmptyStateProps> = ({
  activeTeamId,
  canClone,
  onCreateCatalog,
  onClone,
}) => (
  <Empty description='У команды нет активного каталога'>
    <Space>
      <Button type='primary' disabled={!activeTeamId} onClick={onCreateCatalog}>
        Создать каталог
      </Button>
      <Button icon={<CopyOutlined />} disabled={!activeTeamId || !canClone} onClick={onClone}>
        Клонировать
      </Button>
    </Space>
  </Empty>
)
