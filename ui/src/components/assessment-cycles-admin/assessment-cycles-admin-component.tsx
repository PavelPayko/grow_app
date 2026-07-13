import { useMemo, useState, type FC } from 'react'

import {
  Alert,
  Button,
  DatePicker,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  type TableProps,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import {
  activateCycle,
  closeCycle,
  createTeamCycle,
  fetchTeamCycles,
} from 'core/api/competency-assessment-api'
import { fetchCatalogs } from 'core/api/competency-catalog-api'
import { fetchTeams } from 'core/api/teams-api'
import type { IAssessmentCycle } from 'core/types/competency'

import type {
  IAssessmentCyclesAdminProps,
  ICreateCycleFormValues,
} from './assessment-cycles-admin-types'
import {
  CYCLE_STATUS_COLORS,
  CYCLE_STATUS_LABELS,
} from './assessment-cycles-admin-types'

type ApiError = AxiosError<{ error: string }>

function getApiError(error: unknown): string {
  return (error as ApiError)?.response?.data?.error || 'Произошла ошибка'
}

export const AssessmentCyclesAdminComponent: FC<IAssessmentCyclesAdminProps> = ({
  teamIds,
}) => {
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  })

  const visibleTeams = useMemo(() => {
    if (!teamIds?.length) return teams
    const allowed = new Set(teamIds)
    return teams.filter((team) => allowed.has(team.id))
  }, [teamIds, teams])

  const { data: catalogs = [] } = useQuery({
    queryKey: ['catalogs'],
    queryFn: fetchCatalogs,
  })

  const catalogNameById = useMemo(
    () => new Map(catalogs.map((catalog) => [catalog.id, catalog.name])),
    [catalogs]
  )

  const activeTeamId = selectedTeamId || visibleTeams[0]?.id || null
  const activeTeam = visibleTeams.find((team) => team.id === activeTeamId) ?? null

  const {
    data: cycles = [],
    isLoading: cyclesLoading,
    isFetching: cyclesFetching,
  } = useQuery({
    queryKey: ['teamCycles', activeTeamId],
    queryFn: () => fetchTeamCycles(activeTeamId!),
    enabled: Boolean(activeTeamId),
  })

  const invalidateCycles = () => {
    queryClient.invalidateQueries({ queryKey: ['teamCycles', activeTeamId] })
    queryClient.invalidateQueries({ queryKey: ['activeTeamCycle', activeTeamId] })
  }

  const createCycleMutation = useMutation({
    mutationFn: (values: ICreateCycleFormValues) =>
      createTeamCycle(activeTeamId!, {
        name: values.name.trim(),
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      }),
    onSuccess: () => {
      message.success('Цикл создан')
      setIsCreateOpen(false)
      invalidateCycles()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const activateMutation = useMutation({
    mutationFn: activateCycle,
    onSuccess: () => {
      message.success('Цикл активирован')
      invalidateCycles()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const closeMutation = useMutation({
    mutationFn: closeCycle,
    onSuccess: () => {
      message.success('Цикл закрыт')
      invalidateCycles()
    },
    onError: (error) => message.error(getApiError(error)),
  })

  const hasCatalog = Boolean(activeTeam?.catalog_id)

  const columns: TableProps<IAssessmentCycle>['columns'] = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Каталог',
      key: 'catalog',
      render: (_, record) => catalogNameById.get(record.catalog_id) ?? '—',
      sorter: (a, b) =>
        (catalogNameById.get(a.catalog_id) || '').localeCompare(
          catalogNameById.get(b.catalog_id) || '',
          'ru'
        ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: IAssessmentCycle['status']) => (
        <Tag color={CYCLE_STATUS_COLORS[status]}>{CYCLE_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: 'Период',
      key: 'period',
      render: (_, record) => {
        const start = record.start_date
          ? new Date(record.start_date).toLocaleDateString()
          : '—'
        const end = record.end_date ? new Date(record.end_date).toLocaleDateString() : '—'
        return `${start} — ${end}`
      },
    },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'draft' && (
            <Popconfirm
              title='Активировать цикл?'
              description='Текущий активный цикл команды будет закрыт. Грейды сотрудников будут зафиксированы.'
              okText='Активировать'
              onConfirm={() => activateMutation.mutate(record.id)}
            >
              <Button type='link' size='small' loading={activateMutation.isPending}>
                Активировать
              </Button>
            </Popconfirm>
          )}
          {record.status === 'active' && (
            <Popconfirm
              title='Закрыть цикл?'
              description='Оценки станут доступны только для просмотра.'
              okText='Закрыть'
              onConfirm={() => closeMutation.mutate(record.id)}
            >
              <Button type='link' size='small' danger loading={closeMutation.isPending}>
                Закрыть
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Flex gap={16} align='center' wrap='wrap' justify='space-between'>
        <Space wrap>
          <Typography.Text strong>Команда:</Typography.Text>
          <Select
            style={{ minWidth: 240 }}
            loading={teamsLoading}
            value={activeTeamId}
            onChange={setSelectedTeamId}
            options={visibleTeams.map((team) => ({ value: team.id, label: team.name }))}
            placeholder='Выберите команду'
          />
        </Space>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          disabled={!activeTeamId || !hasCatalog}
          onClick={() => setIsCreateOpen(true)}
        >
          Создать цикл
        </Button>
      </Flex>

      {!hasCatalog && activeTeamId && !teamsLoading && (
        <Alert
          type='warning'
          showIcon
          message='У команды не назначен каталог'
          description='Назначьте каталог на вкладке «Команды».'
        />
      )}

      <Table
        rowKey='id'
        columns={columns}
        dataSource={cycles}
        loading={cyclesLoading || cyclesFetching}
        locale={{ emptyText: 'Циклы оценки не найдены' }}
      />

      <Modal
        title='Создать цикл оценки'
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        okButtonProps={{
          htmlType: 'submit',
          form: 'create-cycle',
          loading: createCycleMutation.isPending,
        }}
        destroyOnHidden
      >
        <Form<ICreateCycleFormValues>
          name='create-cycle'
          layout='vertical'
          clearOnDestroy
          onFinish={(values) => createCycleMutation.mutate(values)}
        >
          {activeTeam?.catalog_name && (
            <Typography.Paragraph type='secondary'>
              Каталог команды: {activeTeam.catalog_name}
            </Typography.Paragraph>
          )}
          <Form.Item
            name='name'
            label='Название'
            rules={[{ required: true, message: 'Введите название цикла' }]}
          >
            <Input placeholder='Например, Q1 2026' />
          </Form.Item>
          <Form.Item name='start_date' label='Дата начала'>
            <DatePicker style={{ width: '100%' }} format='DD.MM.YYYY' />
          </Form.Item>
          <Form.Item name='end_date' label='Дата окончания'>
            <DatePicker style={{ width: '100%' }} format='DD.MM.YYYY' />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  )
}
