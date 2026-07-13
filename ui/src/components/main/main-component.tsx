import { useEffect, useMemo, useState, type FC } from 'react'

import { type IMainProps } from './main-types'
import { instanceAxios } from '../../core/api/axios'
import { Empty, Flex, Layout, Menu, Select, Spin, theme, type MenuProps } from 'antd'
import { useNavigate } from 'react-router'
import { AddUser } from 'components/add-user'
import { useQuery } from '@tanstack/react-query'
import type { IUser, ITeam } from 'core/types/user'
import { fetchUsers } from 'core/api/users-api'
import { fetchTeams } from 'core/api/teams-api'
import { readSelectedTeamId, writeSelectedTeamId } from 'core/utils/selected-team'
import { writeStoredUser } from 'core/utils/current-user-storage'
import { consumeOpenMyProfile } from 'core/utils/my-profile-navigation'

import { Content, TEAM_DASHBOARD_KEY } from 'components/content'

function getAvailableTeams(user: IUser, teams: ITeam[]): ITeam[] {
    if (user.role === 'admin') {
        return teams
    }
    if (user.role === 'lead') {
        const managedIds = user.managed_team_ids ?? []
        return teams.filter((team) => managedIds.includes(team.id))
    }
    return []
}

export const MainComponent: FC<IMainProps> = () => {
    const navigate = useNavigate()

    const [userData, setUserData] = useState<IUser | null>(null)
    const [activeUser, setActiveUser] = useState<string | null>(null)
    const [selectedTeamIdOverride, setSelectedTeamId] = useState<string | null>(null)

    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

    const isManager = userData?.role === 'admin' || userData?.role === 'lead'

    const { data: teams = [] } = useQuery({
        queryKey: ['teams'],
        queryFn: fetchTeams,
        enabled: isManager,
    })

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
        enabled: isManager,
    })

    const availableTeams = useMemo(
        () => (userData ? getAvailableTeams(userData, teams) : []),
        [userData, teams]
    )

    const selectedTeamId = useMemo(() => {
        if (!availableTeams.length) {
            return selectedTeamIdOverride ?? readSelectedTeamId()
        }

        const candidate = selectedTeamIdOverride ?? readSelectedTeamId()
        const isValid = candidate && availableTeams.some((team) => team.id === candidate)

        if (isValid) {
            return candidate
        }

        return availableTeams[0].id
    }, [availableTeams, selectedTeamIdOverride])

    const showTeamSelector = userData?.role === 'admin'
        || (userData?.role === 'lead' && (userData.managed_team_ids?.length ?? 0) > 1)

    const teamMembers = useMemo(() => {
        if (!selectedTeamId) return []
        return users.filter(
            (user) => user.team_id === selectedTeamId && user.login !== 'admin'
        )
    }, [users, selectedTeamId])

    const sidebarItems: MenuProps['items'] = useMemo(() => {
        if (!userData) return []

        const items: MenuProps['items'] = [
            {
                key: TEAM_DASHBOARD_KEY,
                label: 'Дашборд команды',
            },
            {
                key: 'divider',
                type: 'divider',
            }
        ]

        if (userData.role === 'lead') {
            items.push({
                key: userData.id,
                label: 'Мой профиль',
            })
        }

        for (const member of teamMembers) {
            items.push({
                key: member.id,
                label: member.full_name,
            })
        }

        return items
    }, [teamMembers, userData])

    useEffect(() => {
        instanceAxios.get('/api/auth_me')
            .then((data) => {
                writeStoredUser(data.data)
                setUserData(data.data)

                if (data.data.role === 'user') {
                    setActiveUser(data.data.id)
                    return
                }

                if (data.data.role === 'lead' && consumeOpenMyProfile()) {
                    setActiveUser(data.data.id)
                }
            })
            .catch((err) => {
                if (err.status === 401) {
                    navigate('/auth')
                } else {
                    console.error({ err })
                }
            })
    }, [navigate])

    useEffect(() => {
        if (!availableTeams.length || !selectedTeamId) return

        const stored = readSelectedTeamId()
        if (stored !== selectedTeamId) {
            writeSelectedTeamId(selectedTeamId)
        }
    }, [availableTeams, selectedTeamId])

    const handleTeamChange = (teamId: string) => {
        setSelectedTeamId(teamId)
        writeSelectedTeamId(teamId)
        setActiveUser(null)
    }

    const handleMenuSelect: MenuProps['onSelect'] = (info) => {
        if (info.key === TEAM_DASHBOARD_KEY) {
            setActiveUser(null)
            return
        }
        setActiveUser(info.key)
    }

    if (!userData?.role) {
        return (
            <Flex align='center' justify='center'>
                <Spin spinning />
            </Flex>
        )
    }

    if (userData.role === 'user') {
        return <Content userId={userData.id} />
    }

    if (userData.role === 'lead' && !(userData.managed_team_ids?.length)) {
        return (
            <Flex align='center' justify='center' style={{ height: '100%', padding: 24 }}>
                <Empty description='У вас не назначены команды для управления. Обратитесь к администратору.' />
            </Flex>
        )
    }

    const selectedMenuKey = activeUser ?? TEAM_DASHBOARD_KEY

    return (
        <Layout style={{ height: '100%' }}>
            <Flex style={{ width: '100%' }} gap={16}>
                <Layout.Sider
                    width={240}
                    style={{ background: colorBgContainer, borderRadius: borderRadiusLG, padding: 8 }}
                >
                    <Flex vertical justify='space-between' style={{ height: '100%' }} gap={12}>
                        <Flex vertical gap={12} style={{ flex: 1, minHeight: 0 }}>
                            {showTeamSelector && (
                                <Select
                                    value={selectedTeamId ?? undefined}
                                    onChange={handleTeamChange}
                                    placeholder='Выберите команду'
                                    options={availableTeams.map((team) => ({
                                        value: team.id,
                                        label: team.name,
                                    }))}
                                />
                            )}
                            <Menu
                                mode='inline'
                                selectedKeys={[selectedMenuKey]}
                                style={{ flex: 1, borderInlineEnd: 0, overflow: 'auto' }}
                                items={sidebarItems}
                                onSelect={handleMenuSelect}
                            />
                        </Flex>
                        {userData.role === 'admin' && <AddUser />}
                    </Flex>
                </Layout.Sider>

                <Content
                    userId={activeUser}
                    selectedTeamId={selectedTeamId}
                    onSelectUser={setActiveUser}
                />
            </Flex>
        </Layout>
    )
}
