import { useState, type FC } from 'react'

import {
    Button,
    Flex,
    Form,
    Input,
    Modal,
    Table,
    Typography,
    message,
    type TableProps,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import { createTeam, fetchTeams } from 'core/api/teams-api'
import type { ITeam } from 'core/types/user'
import type { ICreateTeamFormValues, ITeamsAdminProps } from './teams-admin-types'

type ApiError = AxiosError<{ error: string }>

function getApiError(error: unknown): string {
    return (error as ApiError)?.response?.data?.error || 'Произошла ошибка'
}

export const TeamsAdminComponent: FC<ITeamsAdminProps> = () => {
    const queryClient = useQueryClient()
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const { data: teams = [], isLoading, isFetching } = useQuery({
        queryKey: ['teams'],
        queryFn: fetchTeams,
    })

    const createTeamMutation = useMutation({
        mutationFn: (values: ICreateTeamFormValues) => createTeam(values.name.trim()),
        onSuccess: () => {
            message.success('Команда создана')
            setIsCreateOpen(false)
            queryClient.invalidateQueries({ queryKey: ['teams'] })
        },
        onError: (error) => message.error(getApiError(error)),
    })

    const columns: TableProps<ITeam>['columns'] = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Создана',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (value: string) => new Date(value).toLocaleString(),
            sorter: (a, b) => new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf(),
        },
    ]

    return (
        <Flex vertical gap={16}>
            <Flex justify='space-between' align='center'>
                <Typography.Text type='secondary'>
                    Управление командами для каталогов компетенций и циклов оценки
                </Typography.Text>
                <Button
                    type='primary'
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreateOpen(true)}
                >
                    Создать команду
                </Button>
            </Flex>

            <Table
                rowKey='id'
                columns={columns}
                dataSource={teams}
                loading={isLoading || isFetching}
                locale={{ emptyText: 'Команды не найдены' }}
            />

            <Modal
                title='Создать команду'
                open={isCreateOpen}
                onCancel={() => setIsCreateOpen(false)}
                okButtonProps={{
                    htmlType: 'submit',
                    form: 'create-team',
                    loading: createTeamMutation.isPending,
                }}
                destroyOnHidden
            >
                <Form<ICreateTeamFormValues>
                    name='create-team'
                    layout='vertical'
                    clearOnDestroy
                    onFinish={(values) => createTeamMutation.mutate(values)}
                >
                    <Form.Item
                        name='name'
                        label='Название'
                        rules={[
                            { required: true, message: 'Введите название команды' },
                            { whitespace: true, message: 'Название не может быть пустым' },
                        ]}
                    >
                        <Input placeholder='Например, Backend Team' />
                    </Form.Item>
                </Form>
            </Modal>
        </Flex>
    )
}
