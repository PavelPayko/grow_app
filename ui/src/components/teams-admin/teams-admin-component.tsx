import { useState, type FC } from 'react'

import {
    Button,
    Flex,
    Form,
    Input,
    Modal,
    Select,
    Table,
    Typography,
    Alert,
    message,
    type TableProps,
} from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import { fetchCatalogs } from 'core/api/competency-catalog-api'
import { createTeam, fetchTeams, updateTeam } from 'core/api/teams-api'
import type { ITeam } from 'core/types/user'
import type {
    ICreateTeamFormValues,
    IEditTeamFormValues,
    ITeamsAdminProps,
} from './teams-admin-types'

type ApiError = AxiosError<{ error: string }>

function getApiError(error: unknown): string {
    return (error as ApiError)?.response?.data?.error || 'Произошла ошибка'
}

function CatalogChangeHint({ initialCatalogId }: { initialCatalogId?: string | null }) {
    const catalogId = Form.useWatch<string | undefined>('catalog_id')
    const catalogChanged =
        initialCatalogId != null &&
        (catalogId ?? null) !== initialCatalogId

    if (!catalogChanged) {
        return null
    }

    return (
        <Alert
            type='info'
            showIcon
            message='Смена каталога не затрагивает существующие циклы оценки'
            description='У уже созданных циклов сохраняется каталог, назначенный при их создании. Новый каталог будет использоваться для матрицы команды и только для новых циклов.'
            style={{ marginBottom: 16 }}
        />
    )
}

export const TeamsAdminComponent: FC<ITeamsAdminProps> = () => {
    const queryClient = useQueryClient()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingTeam, setEditingTeam] = useState<ITeam | null>(null)

    const { data: teams = [], isLoading, isFetching } = useQuery({
        queryKey: ['teams'],
        queryFn: fetchTeams,
    })

    const { data: catalogs = [], isLoading: catalogsLoading } = useQuery({
        queryKey: ['catalogs'],
        queryFn: fetchCatalogs,
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

    const updateTeamMutation = useMutation({
        mutationFn: ({
            teamId,
            values,
        }: {
            teamId: string
            values: IEditTeamFormValues
        }) =>
            updateTeam(teamId, {
                name: values.name.trim(),
                catalog_id: values.catalog_id ?? null,
            }),
        onSuccess: () => {
            message.success('Команда обновлена')
            setEditingTeam(null)
            queryClient.invalidateQueries({ queryKey: ['teams'] })
        },
        onError: (error) => message.error(getApiError(error)),
    })

    const catalogOptions = catalogs.map((catalog) => ({
        value: catalog.id,
        label: catalog.name,
    }))

    const columns: TableProps<ITeam>['columns'] = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Каталог',
            dataIndex: 'catalog_name',
            key: 'catalog_name',
            render: (value: string | null | undefined) => value || '—',
            sorter: (a, b) =>
                (a.catalog_name || '').localeCompare(b.catalog_name || '', 'ru'),
        },
        {
            title: 'Создана',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (value: string) => new Date(value).toLocaleString(),
            sorter: (a, b) => new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf(),
        },
        {
            title: '',
            key: 'actions',
            width: 120,
            render: (_, team) => (
                <Button
                    type='link'
                    icon={<EditOutlined />}
                    onClick={() => setEditingTeam(team)}
                >
                    Изменить
                </Button>
            ),
        },
    ]

    return (
        <Flex vertical gap={16}>
            <Flex justify='space-between' align='center'>
                <Typography.Text type='secondary'>
                    Управление командами: привязка каталога компетенций и циклы оценки
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

            <Modal
                title='Изменить команду'
                open={Boolean(editingTeam)}
                onCancel={() => setEditingTeam(null)}
                okButtonProps={{
                    htmlType: 'submit',
                    form: 'edit-team',
                    loading: updateTeamMutation.isPending,
                }}
                destroyOnHidden
            >
                <Form<IEditTeamFormValues>
                    key={editingTeam?.id || 'edit-team'}
                    name='edit-team'
                    layout='vertical'
                    initialValues={{
                        name: editingTeam?.name,
                        catalog_id: editingTeam?.catalog_id ?? undefined,
                    }}
                    onFinish={(values) => {
                        if (!editingTeam) {
                            return
                        }
                        updateTeamMutation.mutate({
                            teamId: editingTeam.id,
                            values,
                        })
                    }}
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
                    <Form.Item name='catalog_id' label='Каталог компетенций'>
                        <Select
                            allowClear
                            showSearch
                            optionFilterProp='label'
                            loading={catalogsLoading}
                            placeholder='Не назначен'
                            options={catalogOptions}
                        />
                    </Form.Item>
                    <CatalogChangeHint initialCatalogId={editingTeam?.catalog_id} />
                </Form>
            </Modal>
        </Flex>
    )
}
