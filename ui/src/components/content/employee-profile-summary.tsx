import type { FC, ReactNode } from 'react'

import { MailOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Flex, Spin, Tag, Typography, theme } from 'antd'

import { useViewedUser } from 'core/hooks/use-viewed-user'
import { formatGradeLabel } from 'core/types/user'

interface EmployeeProfileSummaryProps {
  userId: string
}

function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Flex align='center' gap={6}>
      <Typography.Text type='secondary' style={{ fontSize: 13 }}>
        {icon}
      </Typography.Text>
      <Typography.Text type='secondary' style={{ fontSize: 13 }}>
        {children}
      </Typography.Text>
    </Flex>
  )
}

export const EmployeeProfileSummary: FC<EmployeeProfileSummaryProps> = ({ userId }) => {
  const { viewedUser, isLoading } = useViewedUser(userId)
  const {
    token: { colorFillQuaternary, borderRadius },
  } = theme.useToken()

  if (isLoading) {
    return (
      <Flex align='center' justify='center' style={{ padding: '16px 0' }}>
        <Spin size='small' />
      </Flex>
    )
  }

  if (!viewedUser) {
    return null
  }

  return (
    <Flex
      gap={16}
      align='flex-start'
      style={{
        padding: '12px 16px',
        marginBottom: 16,
        background: colorFillQuaternary,
        borderRadius,
      }}
    >
      <Avatar size={48} icon={<UserOutlined />} style={{ flexShrink: 0 }} />
      <Flex vertical gap={4} style={{ minWidth: 0, flex: 1 }}>
        <Flex align='center' gap={8} wrap='wrap'>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {viewedUser.full_name}
          </Typography.Title>
          {viewedUser.grade && <Tag>{formatGradeLabel(viewedUser.grade)}</Tag>}
        </Flex>

        {viewedUser.job_title && (
          <Typography.Text type='secondary'>{viewedUser.job_title}</Typography.Text>
        )}

        {(viewedUser.team_name || viewedUser.email) && (
          <Flex gap={16} wrap='wrap' style={{ marginTop: 2 }}>
            {viewedUser.team_name && (
              <MetaItem icon={<TeamOutlined />}>{viewedUser.team_name}</MetaItem>
            )}
            {viewedUser.email && (
              <MetaItem icon={<MailOutlined />}>{viewedUser.email}</MetaItem>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
