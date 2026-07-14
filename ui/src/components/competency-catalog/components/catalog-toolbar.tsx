import type { FC } from 'react'

import { Button, Dropdown, Flex, Modal, Select, Tooltip, Typography } from 'antd'
import type { MenuProps } from 'antd'
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons'

import type { ICompetencyCatalog } from 'core/types/competency'

interface CatalogToolbarProps {
  catalogs: ICompetencyCatalog[]
  catalogsLoading: boolean
  activeCatalogId: string | null
  deletePending: boolean
  onCatalogChange: (catalogId: string) => void
  onCreateClick: () => void
  onEditClick: () => void
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
  onEditClick,
  onCloneClick,
  onDeleteClick,
}) => {
  const catalogActions: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Переименовать',
      icon: <EditOutlined />,
      disabled: !activeCatalogId,
    },
    {
      key: 'clone',
      label: 'Дублировать',
      icon: <CopyOutlined />,
      disabled: !activeCatalogId,
    },
    { type: 'divider' },
    {
      key: 'delete',
      label: 'Удалить',
      icon: <DeleteOutlined />,
      danger: true,
      disabled: !activeCatalogId,
    },
  ]

  const handleCatalogAction: MenuProps['onClick'] = ({ key }) => {
    if (key === 'edit') {
      onEditClick()
      return
    }
    if (key === 'clone') {
      onCloneClick()
      return
    }
    if (key === 'delete') {
      Modal.confirm({
        title: 'Удалить каталог?',
        content:
          'Каталог можно удалить только если он не привязан к командам и не использовался в циклах оценки.',
        okText: 'Удалить',
        cancelText: 'Отмена',
        okButtonProps: { danger: true, loading: deletePending },
        onOk: onDeleteClick,
      })
    }
  }

  return (
    <Flex gap={16} align='center' wrap='wrap'>
      <Typography.Text strong>Каталог:</Typography.Text>
      <Flex gap={4} align='center'>
        <Select
          style={{ minWidth: 240 }}
          loading={catalogsLoading}
          value={activeCatalogId}
          onChange={onCatalogChange}
          options={catalogs.map((item) => ({ value: item.id, label: item.name }))}
          placeholder='Выберите каталог'
        />
        <Dropdown menu={{ items: catalogActions, onClick: handleCatalogAction }}>
          <Tooltip title='Действия с каталогом'>
            <span>
              <Button
                icon={<MoreOutlined />}
                disabled={!activeCatalogId}
                aria-label='Действия с каталогом'
              />
            </span>
          </Tooltip>
        </Dropdown>
      </Flex>
      <Button type='primary' icon={<PlusOutlined />} onClick={onCreateClick}>
        Создать каталог
      </Button>
    </Flex>
  )
}
