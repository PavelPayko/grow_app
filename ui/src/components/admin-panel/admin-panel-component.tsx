import { type FC } from 'react'

import { type IMainProps } from './admin-panel-types'
import { Flex, Table, Tabs, type TableProps } from 'antd'
import { fetchUsers } from 'core/api/users-api'
import { useQuery } from '@tanstack/react-query'
import type { IUser } from 'core/types/user'
import { UpdateUser } from 'components/update-user'
import { DeleteUser } from 'components/delete-user'
import { CompetencyCatalog } from 'components/competency-catalog'
import { TeamsAdmin } from 'components/teams-admin'
import { AssessmentCyclesAdmin } from 'components/assessment-cycles-admin'

export const AdminPanelComponent: FC<IMainProps> = () => {
    const { data: users, isPending, isFetching, isLoading, isRefetching } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
        select: data => data || []
    })

    const columns: TableProps<IUser>['columns'] = [
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
            key: 'address',
            render: value => value || '-',
        },
        {
            title: 'Действие',
            key: 'action',
            render: (_, record) => (
                <Flex>
                    <UpdateUser data={record} />
                    <DeleteUser id={record.id} />
                </Flex>
            ),
        },
    ];

    return (
        <Tabs
            defaultActiveKey='users'
            items={[
                {
                    key: 'users',
                    label: 'Пользователи',
                    children: (
                        <Table
                            columns={columns}
                            dataSource={users}
                            loading={isFetching || isLoading || isPending || isRefetching}
                            rowKey='id'
                        />
                    ),
                },
                {
                    key: 'teams',
                    label: 'Команды',
                    children: <TeamsAdmin />,
                },
                {
                    key: 'catalog',
                    label: 'Каталог компетенций',
                    children: <CompetencyCatalog />,
                },
                {
                    key: 'cycles',
                    label: 'Циклы оценки',
                    children: <AssessmentCyclesAdmin />,
                },
            ]}
        />
    )
}