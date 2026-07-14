import { type FC, useMemo } from 'react'

import { type IMainProps } from './admin-panel-types'
import { Flex, Table, Tabs, type TableProps } from 'antd'
import { fetchUsers } from 'core/api/users-api'
import { useQuery } from '@tanstack/react-query'
import type { IUser, IUserRole } from 'core/types/user'
import { USER_ROLE_LABELS } from 'core/types/user'
import { UpdateUser } from 'components/update-user'
import { DeleteUser } from 'components/delete-user'
import { CompetencyCatalog } from 'components/competency-catalog'
import { TeamsAdmin } from 'components/teams-admin'
import { AssessmentCyclesAdmin } from 'components/assessment-cycles-admin'
import { OrgDashboard } from 'components/org-dashboard'
import { useCurrentUser } from 'core/hooks/use-current-user'

export const AdminPanelComponent: FC<IMainProps> = () => {
    const { isAdmin, isLead, managedTeamIds } = useCurrentUser()
    const canAccessPanel = isAdmin || isLead

    const { data: users, isPending, isFetching, isLoading, isRefetching } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
        select: data => data || [],
        enabled: canAccessPanel,
    })

    const usersLoading = isFetching || isLoading || isPending || isRefetching

    const columns: TableProps<IUser>['columns'] = useMemo(() => {
        const base: TableProps<IUser>['columns'] = [
            {
                title: 'Имя',
                dataIndex: 'full_name',
                key: 'full_name',
                render: value => value || '-',
                sorter: (a, b) => {
                    if (a.full_name > b.full_name) return 1
                    if (a.full_name < b.full_name) return -1
                    return 0
                }
            },
            {
                title: 'Должность',
                dataIndex: 'job_title',
                key: 'job_title',
                render: value => value || '-',
                sorter: (a, b) => (a.job_title || '').localeCompare(b.job_title || ''),
            },
            {
                title: 'Логин',
                dataIndex: 'login',
                key: 'login',
                render: value => value || '-',
                sorter: (a, b) => {
                    if (a.login > b.login) return 1
                    if (a.login < b.login) return -1
                    return 0
                }
            },
            {
                title: 'Зарегистрирован',
                dataIndex: 'created_at',
                key: 'created_at',
                render: value => value ? new Date(value).toLocaleString() : '-',
                sorter: (a, b) => new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf()
            },
            {
                title: 'Почта',
                dataIndex: 'email',
                key: 'address',
                render: value => value || '-',
            },
            {
                title: 'Телефон',
                dataIndex: 'phone',
                key: 'address',
                render: value => value || '-',
            },
            {
                title: 'Роль',
                dataIndex: 'role',
                key: 'role',
                render: (value: IUserRole) => USER_ROLE_LABELS[value] || value || '-',
            },
        ]

        if (isAdmin) {
            base.push({
                title: 'Действие',
                key: 'action',
                render: (_, record) => (
                    <Flex>
                        <UpdateUser data={record} />
                        <DeleteUser id={record.id} />
                    </Flex>
                ),
            })
        }

        return base
    }, [isAdmin])

    const tabItems = useMemo(() => {
        if (!canAccessPanel) {
            return []
        }

        const items = [
            {
                key: 'users',
                label: 'Пользователи',
                children: (
                    <Table
                        columns={columns}
                        dataSource={users}
                        loading={usersLoading}
                        rowKey='id'
                    />
                ),
            },
            {
                key: 'teams',
                label: 'Команды',
                children: <TeamsAdmin readOnly={isLead} />,
            },
            {
                key: 'cycles',
                label: 'Циклы оценки',
                children: (
                    <AssessmentCyclesAdmin
                        teamIds={isLead ? managedTeamIds : undefined}
                    />
                ),
            },
            {
                key: 'summary',
                label: 'Итоги',
                children: <OrgDashboard />,
            },
        ]

        if (isAdmin) {
            items.splice(2, 0, {
                key: 'catalog',
                label: 'Каталог компетенций',
                children: <CompetencyCatalog />,
            })
        }

        return items
    }, [
        canAccessPanel,
        columns,
        isAdmin,
        isLead,
        managedTeamIds,
        users,
        usersLoading,
    ])

    return (
        <Tabs
            defaultActiveKey='users'
            items={tabItems}
        />
    )
}
