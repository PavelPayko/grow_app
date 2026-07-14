import { type FC } from 'react'

import {
    Button,
    Card,
    Collapse,
    Flex,
    Table,
    Tag,
    Typography,
} from 'antd'
import {
    CalculatorOutlined,
    CalendarOutlined,
    DashboardOutlined,
    TableOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'

import { CYCLE_STATUS_LABELS } from 'components/competency-matrix/competency-matrix-constants'
import { TARGET_STATUS_LABELS } from 'core/constants/target-status'

const { Title, Paragraph, Text } = Typography

const SCORE_DESCRIPTIONS = [
    { score: '—', meaning: 'Компетенция ещё не оценена. Не участвует в расчёте итогов.' },
    { score: '0', meaning: 'Компетенция не проявляется или требует существенного развития.' },
    { score: '1', meaning: 'Базовый уровень: выполняет задачи с поддержкой.' },
    { score: '2', meaning: 'Уверенный уровень: самостоятельно применяет на практике.' },
    { score: '3', meaning: 'Продвинутый уровень: экспертиза, может обучать других.' },
]

const GRADE_LABELS: Record<string, string> = {
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
}

export const InfoComponent: FC = () => {
    const navigate = useNavigate()

    return (
        <Flex vertical gap={24} style={{ maxWidth: 900, margin: '0 auto' }}>
            <div>
                <Title level={2} style={{ marginTop: 0 }}>Справка по работе с Grow App</Title>
                <Paragraph type="secondary">
                    Краткое руководство: как устроены циклы оценки, матрица компетенций
                    и расчёт итоговых значений.
                </Paragraph>
            </div>

            <Card title={<><TeamOutlined /> О приложении</>}>
                <Paragraph>
                    Grow App помогает вести индивидуальный план развития (ИПР) и оценивать
                    компетенции сотрудников. Оценки хранятся по циклам, чтобы можно было
                    отслеживать прогресс во времени — данные прошлых циклов не перезаписываются.
                </Paragraph>
                <Paragraph>
                    Каталог компетенций организован иерархически:
                    {' '}<Text strong>каталог → блоки → домены → компетенции</Text>.
                    У каждой компетенции есть вес и критерий уровня. Команда привязана
                    к своему каталогу.
                </Paragraph>
            </Card>

            <Card title={<><UserOutlined /> Роли</>}>
                <Collapse
                    ghost
                    items={[
                        {
                            key: 'user',
                            label: <Text strong>Сотрудник (user)</Text>,
                            children: (
                                <Paragraph>
                                    Видит свой профиль: таймлайн ИПР, дашборд компетенций
                                    и матрицу в режиме просмотра. Оценки выставляют руководитель
                                    или администратор.
                                </Paragraph>
                            ),
                        },
                        {
                            key: 'lead',
                            label: <Text strong>Руководитель (lead)</Text>,
                            children: (
                                <Paragraph>
                                    Управляет назначенными командами: просматривает и оценивает
                                    сотрудников, запускает и закрывает циклы оценки, работает
                                    с дашбордом команды. Доступ к разделу «Администрирование»
                                    в рамках своих команд.
                                </Paragraph>
                            ),
                        },
                        {
                            key: 'admin',
                            label: <Text strong>Администратор (admin)</Text>,
                            children: (
                                <Paragraph>
                                    Полный доступ: все команды, каталоги компетенций, циклы,
                                    пользователи. Настраивает структуру каталога и целевые
                                    диапазоны по грейдам.
                                </Paragraph>
                            ),
                        },
                    ]}
                />
            </Card>

            <Card title={<><CalendarOutlined /> Циклы оценки</>}>
                <Paragraph>
                    Цикл — это период оценки компетенций для команды (например, «Q1 2026»).
                    У каждого цикла один из статусов:
                </Paragraph>
                <Flex gap={8} wrap="wrap" style={{ marginBottom: 16 }}>
                    <Tag>{CYCLE_STATUS_LABELS.draft}</Tag>
                    <Tag color="processing">{CYCLE_STATUS_LABELS.active}</Tag>
                    <Tag color="default">{CYCLE_STATUS_LABELS.closed}</Tag>
                </Flex>
                <Collapse
                    ghost
                    defaultActiveKey={['lifecycle']}
                    items={[
                        {
                            key: 'lifecycle',
                            label: 'Жизненный цикл',
                            children: (
                                <ol style={{ paddingLeft: 20, margin: 0 }}>
                                    <li>
                                        <Text strong>Черновик</Text> — цикл создан, оценки
                                        ещё не вводятся. Можно подготовить название и параметры.
                                    </li>
                                    <li>
                                        <Text strong>Активный</Text> — идёт оценка. Руководитель
                                        или администратор заполняет матрицу. При активации
                                        фиксируется снимок грейда каждого сотрудника команды.
                                    </li>
                                    <li>
                                        <Text strong>Закрыт</Text> — оценка завершена, данные
                                        доступны только для просмотра.
                                    </li>
                                </ol>
                            ),
                        },
                        {
                            key: 'rules',
                            label: 'Важные правила',
                            children: (
                                <ul style={{ paddingLeft: 20, margin: 0 }}>
                                    <li>У команды может быть только один активный цикл.</li>
                                    <li>
                                        При запуске нового цикла предыдущий активный автоматически
                                        закрывается.
                                    </li>
                                    <li>
                                        Каталог цикла фиксируется при создании — изменения
                                        каталога не затрагивают уже созданные циклы.
                                    </li>
                                    <li>
                                        История сохраняется: можно переключаться между циклами
                                        в матрице и сравнивать динамику на дашборде.
                                    </li>
                                </ul>
                            ),
                        },
                    ]}
                />
            </Card>

            <Card title={<><TableOutlined /> Матрица компетенций</>}>
                <Paragraph>
                    Вкладка «Матрица» открывается при просмотре профиля сотрудника.
                    Таблица сгруппирована по блокам и содержит колонки:
                </Paragraph>
                <ul style={{ paddingLeft: 20 }}>
                    <li><Text strong>Домен</Text> — тематическая область внутри блока</li>
                    <li><Text strong>Компетенция</Text> — конкретный навык</li>
                    <li><Text strong>Вес</Text> — значимость компетенции при расчёте итогов</li>
                    <li><Text strong>Критерий</Text> — описание ожидаемого уровня</li>
                    <li><Text strong>Оценка</Text> — балл от 0 до 3 (или пусто)</li>
                    <li><Text strong>Доказательства</Text> — комментарий или примеры</li>
                </ul>
                <Paragraph>
                    Вверху матрицы — панель итогов: грейд сотрудника, взвешенный итог
                    и процент заполненности. В заголовке каждого блока — итог по блоку
                    и статус относительно целевого диапазона.
                </Paragraph>
                <Paragraph type="secondary">
                    Редактирование доступно руководителю и администратору только
                    в <Text strong>активном</Text> цикле. Закрытые циклы открываются
                    в режиме просмотра.
                </Paragraph>
            </Card>

            <Card title="Шкала оценок (0–3)">
                <Table
                    size="small"
                    pagination={false}
                    rowKey="score"
                    dataSource={SCORE_DESCRIPTIONS}
                    columns={[
                        {
                            title: 'Оценка',
                            dataIndex: 'score',
                            width: 80,
                            render: (value: string) => <Text strong>{value}</Text>,
                        },
                        {
                            title: 'Значение',
                            dataIndex: 'meaning',
                        },
                    ]}
                />
                <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                    Точные формулировки уровней задаются в критерии каждой компетенции
                    в каталоге.
                </Paragraph>
            </Card>

            <Card title={<><CalculatorOutlined /> Как считаются итоги</>}>
                <Collapse
                    ghost
                    defaultActiveKey={['weighted', 'fill', 'block']}
                    items={[
                        {
                            key: 'weighted',
                            label: <Text strong>Взвешенный итог (0–3)</Text>,
                            children: (
                                <>
                                    <Paragraph>
                                        Учитываются только компетенции с выставленной оценкой.
                                        Пустые ячейки в расчёт не входят.
                                    </Paragraph>
                                    <Paragraph code style={{ fontSize: 13 }}>
                                        Σ(оценка × вес) / Σ(вес оценённых компетенций)
                                    </Paragraph>
                                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                        Пример: оценки 2 (вес 3) и 3 (вес 1) → (2×3 + 3×1) / (3+1) = 2.25
                                    </Paragraph>
                                </>
                            ),
                        },
                        {
                            key: 'unweighted',
                            label: <Text strong>Невзвешенное среднее</Text>,
                            children: (
                                <Paragraph style={{ marginBottom: 0 }}>
                                    Простое среднее арифметическое по всем непустым оценкам.
                                    Используется на дашбордах для трендов.
                                </Paragraph>
                            ),
                        },
                        {
                            key: 'fill',
                            label: <Text strong>Заполненность (%)</Text>,
                            children: (
                                <>
                                    <Paragraph code style={{ fontSize: 13 }}>
                                        оценённых компетенций / всего в каталоге × 100%
                                    </Paragraph>
                                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                        Показывает, насколько полно заполнена матрица.
                                        Незаполненные компетенции не снижают взвешенный итог,
                                        но снижают заполненность.
                                    </Paragraph>
                                </>
                            ),
                        },
                        {
                            key: 'block',
                            label: <Text strong>Итог по блоку</Text>,
                            children: (
                                <Paragraph style={{ marginBottom: 0 }}>
                                    Та же взвешенная формула, но только по компетенциям
                                    внутри блока. Результат сравнивается с целевым диапазоном
                                    для грейда сотрудника.
                                </Paragraph>
                            ),
                        },
                    ]}
                />
            </Card>

            <Card title="Сравнение с целями (target)">
                <Paragraph>
                    Для каждого блока и грейда ({Object.values(GRADE_LABELS).join(', ')})
                    задан целевой диапазон баллов. Статус блока определяется так:
                </Paragraph>
                <Flex vertical gap={8}>
                    <Flex align="center" gap={8}>
                        <Tag color="warning">{TARGET_STATUS_LABELS.below}</Tag>
                        <Text>взвешенный итог блока ниже минимального target</Text>
                    </Flex>
                    <Flex align="center" gap={8}>
                        <Tag color="processing">{TARGET_STATUS_LABELS.in_range}</Tag>
                        <Text>итог в пределах целевого диапазона</Text>
                    </Flex>
                    <Flex align="center" gap={8}>
                        <Tag color="success">{TARGET_STATUS_LABELS.above}</Tag>
                        <Text>итог выше максимального target</Text>
                    </Flex>
                </Flex>
                <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                    Грейд для сравнения берётся из снимка на момент активации цикла.
                    Если снимка нет — используется текущий грейд сотрудника.
                </Paragraph>
            </Card>

            <Card title={<><DashboardOutlined /> Вкладки профиля</>}>
                <Collapse
                    ghost
                    items={[
                        {
                            key: 'timeline',
                            label: <Text strong>Таймлайн</Text>,
                            children: (
                                <Paragraph style={{ marginBottom: 0 }}>
                                    Индивидуальный план развития: цели, достижения
                                    и события роста сотрудника.
                                </Paragraph>
                            ),
                        },
                        {
                            key: 'dashboard',
                            label: <Text strong>Дашборд</Text>,
                            children: (
                                <Paragraph style={{ marginBottom: 0 }}>
                                    Визуализация компетенций: динамика по циклам,
                                    итоги по блокам, сравнение с целями. У руководителя
                                    при выборе команды без конкретного сотрудника —
                                    дашборд всей команды.
                                </Paragraph>
                            ),
                        },
                        {
                            key: 'matrix',
                            label: <Text strong>Матрица</Text>,
                            children: (
                                <Paragraph style={{ marginBottom: 0 }}>
                                    Детальная таблица оценок с возможностью редактирования
                                    (для руководителя и администратора в активном цикле).
                                </Paragraph>
                            ),
                        },
                    ]}
                />
            </Card>

            <Flex justify="center">
                <Button type="primary" onClick={() => navigate('/')}>
                    На главную
                </Button>
            </Flex>
        </Flex>
    )
}
