import { type FC } from 'react'

import { Layout, Tabs, theme, type TabsProps } from 'antd'
import { Points } from 'components/points'


import { UserDashboard } from 'components/user-dashboard'
import { MainDashboard } from 'components/main-dashboard'
import { CompetencyMatrix } from 'components/competency-matrix'
import type { IContentProps } from './content-types'

export const ContentComponent: FC<IContentProps> = ({
    userId
}) => {

    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()


    const userTabs: TabsProps['items'] = [
        {
            key: 'timeline',
            label: 'Таймлайн',
            children: <Points userId={userId || ''} />,
        },
        {
            key: 'dashboard',
            label: 'Дашборд',
            children: <UserDashboard userId={userId || ''} />
        },
        {
            key: 'matrix',
            label: 'Матрица',
            children: <CompetencyMatrix userId={userId || ''} />
        },
    ];
    const allTabs: TabsProps['items'] = [
        {
            key: 'dashboard',
            label: 'Дашборд',
            children: <MainDashboard />
        }
    ];


    return <Layout.Content
        style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto'
        }}
    >
        <Tabs defaultActiveKey="dashboard" items={userId ? userTabs : allTabs} />
    </Layout.Content>

}