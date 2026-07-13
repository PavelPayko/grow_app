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

import { useCurrentUser } from 'core/hooks/use-current-user'
import { clearStoredUser } from 'core/utils/current-user-storage'
import { requestOpenMyProfile } from 'core/utils/my-profile-navigation'



export const HeaderComponent: FC<IMainProps> = () => {

    const {

        token: { colorBgContainer },

    } = theme.useToken()



    const { user, isAdmin, isLead } = useCurrentUser()



    const navigate = useNavigate()

    const location = useLocation()



    const titleByPath: Record<string, string> = {

        '/': isAdmin ? 'Все сотрудники' : isLead ? 'Мои сотрудники' : 'Мой ИПР',

        '/admin': isLead ? 'Администрирование' : 'Панель администратора',

    }



    const getTitle = () => titleByPath[location.pathname] || ''



    const baseItems: MenuProps['items'] = [

        {

            key: 'logout',

            label: 'Выйти',

            onClick: () => {
                clearStoredUser()
                navigate('/auth')
            }

        },

    ]



    const profileItems: MenuProps['items'] = isLead

        ? [{

            key: 'my-profile',

            label: 'Мой профиль',

            onClick: () => {
                requestOpenMyProfile()
                navigate('/')
            },

        }]

        : []



    const adminItems: MenuProps['items'] = (isAdmin || isLead)

        ? [{

            key: 'admin',

            label: 'Администрирование',

            onClick: () => navigate('/admin'),

        }]

        : []



    const items = [...profileItems, ...adminItems, ...baseItems]



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

            user?.full_name

                ? <Dropdown menu={{ items }}>

                    <Button type='text' icon={<UserOutlined />}>{user.full_name || ''}</Button>

                </Dropdown>

                : null

        }

    </Layout.Header>

}

