import type { FC } from 'react'

import { List, Typography } from 'antd'

import type { IDevelopmentZone } from './user-dashboard-utils'

interface IDevelopmentZonesListProps {
  zones: IDevelopmentZone[]
}

export const DevelopmentZonesList: FC<IDevelopmentZonesListProps> = ({ zones }) => {
  if (!zones.length) {
    return <Typography.Text type='secondary'>Нет оценённых компетенций в активном цикле</Typography.Text>
  }

  return (
    <List
      size='small'
      dataSource={zones}
      renderItem={(zone) => (
        <List.Item>
          <List.Item.Meta
            title={`${zone.competencyName} (${zone.score})`}
            description={`${zone.blockName} / ${zone.domainName}`}
          />
        </List.Item>
      )}
    />
  )
}
