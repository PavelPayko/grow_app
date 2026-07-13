import type { FC } from 'react'

import { Button, Flex, Popconfirm, Select, Typography } from 'antd'
import { CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'

import type { ICompetencyCatalog } from 'core/types/competency'

interface CatalogToolbarProps {
  catalogs: ICompetencyCatalog[]
  catalogsLoading: boolean
  activeCatalogId: string | null
  deletePending: boolean
  onCatalogChange: (catalogId: string) => void
  onCreateClick: () => void
  onCloneClick: () => void
  onDeleteClick: () => void
}

export const CatalogToolbar: FC<CatalogToolbarProps> = ({
  catalogs,
  catalogsLoading,
  activeCatalogId,
  deletePending,
  onCatalogChange,
  onCreateClick,
  onCloneClick,
  onDeleteClick,
}) => (
  <Flex gap={16} align='center' wrap='wrap'>
    <Typography.Text strong>Каталог:</Typography.Text>
    <Select
      style={{ minWidth: 240 }}
      loading={catalogsLoading}
      value={activeCatalogId}
      onChange={onCatalogChange}
      options={catalogs.map((item) => ({ value: item.id, label: item.name }))}
      placeholder='Выберите каталог'
    />
    <Button icon={<PlusOutlined />} onClick={onCreateClick}>
      Создать каталог
    </Button>
    <Button icon={<CopyOutlined />} disabled={!activeCatalogId} onClick={onCloneClick}>
      Дублировать
    </Button>
    <Popconfirm
      title='Удалить каталог?'
      description='Каталог можно удалить только если он не привязан к командам и не использовался в циклах оценки.'
      okText='Удалить'
      cancelText='Отмена'
      okButtonProps={{ danger: true, loading: deletePending }}
      disabled={!activeCatalogId}
      onConfirm={onDeleteClick}
    >
      <Button danger icon={<DeleteOutlined />} disabled={!activeCatalogId}>
        Удалить
      </Button>
    </Popconfirm>
  </Flex>
)
