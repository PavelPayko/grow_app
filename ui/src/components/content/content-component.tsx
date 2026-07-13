import { type FC } from 'react'



import { Layout, Tabs, theme, type TabsProps } from 'antd'

import { Points } from 'components/points'



import { UserDashboard } from 'components/user-dashboard'

import { TeamDashboard } from 'components/team-dashboard'

import { CompetencyMatrix } from 'components/competency-matrix'

import { useCurrentUser } from 'core/hooks/use-current-user'

import type { IContentProps } from './content-types'



const TEAM_DASHBOARD_KEY = '__team_dashboard__'



export const ContentComponent: FC<IContentProps> = ({
    userId,
    selectedTeamId = null,
    onSelectUser,
}) => {

    const { isAdmin, isLead } = useCurrentUser()

    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()



    const showTeamDashboard = !userId && (isAdmin || isLead)



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

    ]



    const managerTabs: TabsProps['items'] = showTeamDashboard

        ? [

            {

                key: 'dashboard',

                label: 'Дашборд',

                children: <TeamDashboard teamId={selectedTeamId} onSelectUser={onSelectUser} />,

            },

        ]

        : userTabs



    const tabs = userId ? userTabs : managerTabs

    const defaultTab = userId ? 'timeline' : 'dashboard'



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

        <Tabs defaultActiveKey={defaultTab} items={tabs} />

    </Layout.Content>

}



export { TEAM_DASHBOARD_KEY }

