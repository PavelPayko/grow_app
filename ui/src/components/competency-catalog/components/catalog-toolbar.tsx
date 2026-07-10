import type { FC } from 'react'

import { Button, Flex, Select, Typography } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

import type { ICompetencyCatalog } from 'core/types/competency'
import type { ITeam } from 'core/types/user'

interface CatalogToolbarProps {
  teams: ITeam[]
  teamsLoading: boolean
  activeTeamId: string | null
  catalog: ICompetencyCatalog | null
  sourceTeamOptions: { value: string; label: string }[]
  onTeamChange: (teamId: string) => void
  onCloneClick: () => void
}

export const CatalogToolbar: FC<CatalogToolbarProps> = ({
  teams,
  teamsLoading,
  activeTeamId,
  catalog,
  sourceTeamOptions,
  onTeamChange,
  onCloneClick,
}) => (
  <Flex gap={16} align='center' wrap='wrap'>
    <Typography.Text strong>Команда:</Typography.Text>
    <Select
      style={{ minWidth: 240 }}
      loading={teamsLoading}
      value={activeTeamId}
      onChange={onTeamChange}
      options={teams.map((team) => ({ value: team.id, label: team.name }))}
      placeholder='Выберите команду'
    />
    {catalog && (
      <Typography.Text type='secondary'>Каталог: {catalog.name}</Typography.Text>
    )}
    <Button
      icon={<CopyOutlined />}
      disabled={!activeTeamId || sourceTeamOptions.length === 0}
      onClick={onCloneClick}
    >
      Клонировать из другой команды
    </Button>
  </Flex>
)
