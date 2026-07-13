import { type FC } from 'react'

import {
    Button,
    Dropdown,
    Flex,
    Layout,
    theme,
    Typography,
    type MenuProps
} from 'antd'

import { type IMainProps } from './header-types'
import { NavLink, useLocation, useNavigate } from 'react-router'

import { RiseOutlined, UserOutlined } from '@ant-design/icons'

export const HeaderComponent: FC<IMainProps> = () => {
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const isAdmin = JSON.parse(localStorage.getItem('user') || '{}')?.role === 'admin'

    const navigate = useNavigate()
    const location = useLocation()

    const titleByPath: Record<string, string> = {
        '/': isAdmin ? 'Мои сотрудники' : 'Мой ИПР',
        '/admin': 'Панель администратора'
    }

    const getTitle = () => titleByPath[location.pathname] || ''


    const userData = JSON.parse(localStorage.getItem('user') || '{}')

    const baseItems: MenuProps['items'] = [
        {
            key: 'logout',
            label: 'Выйти',
            onClick: () => {
                localStorage.setItem('token', '')
                localStorage.setItem('user', '{}')
                navigate('/auth')
            }

        }
    ]

    const items = isAdmin ? [...baseItems, {
        key: 'admin',
        label: 'Администрирование',
        onClick: () => {
            navigate('/admin')
        }
    }] : baseItems

    return <Layout.Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <NavLink to={'/'}>
            <Flex gap={8}>
                <RiseOutlined color='green'
                    size={48}
                    style={{ fontSize: 24, color: 'green' }} />
                <Typography.Text>Grow App</Typography.Text>
            </Flex>
        </NavLink>

        <Typography.Title level={4} style={{ margin: 0 }}>{getTitle()}</Typography.Title>

        {
            userData.full_name
                ? <Dropdown menu={{ items }}>
                    <Button type='text' icon={<UserOutlined />}>{userData.full_name || ''}</Button>
                </Dropdown>
                : null
        }
    </Layout.Header>
}
