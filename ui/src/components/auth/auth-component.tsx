import { type FC } from 'react'

import { NavLink, useNavigate } from 'react-router'

import { Button, Card, Flex, Form, Input, message, Typography } from 'antd'
import { instanceAxios } from '../../core/api/axios'
import { writeStoredUser } from 'core/utils/current-user-storage'
import type { IUser, IUserCreate } from '../../core/types/user'
import type { AxiosError, AxiosResponse } from 'axios'

import styles from './auth.module.css'

export const AuthComponent: FC = () => {
    const navigate = useNavigate();

    const submitHandler = (values: IUserCreate) => {
        instanceAxios
            .post('/api/login', { ...values })
            .then((res: AxiosResponse<{ user: IUser, token: string }>) => {
                localStorage.setItem('token', res.data.token)
                writeStoredUser(res.data.user || {})
                navigate('/')
            })
            .catch((err: AxiosError<{ error: string }>) => {
                console.error({ err });
                message.error(err?.response?.data?.error)
            })
    }

    return <Flex justify='center' align='center' className={styles.container}>
        <Card style={{ width: 600 }}>
            <Form<IUserCreate>
                onFinish={submitHandler}
                layout='vertical'
            >
                <Form.Item
                    name={'login'}
                    label={'Логин'}
                    rules={[
                        { required: true, message: 'Введите логин' }
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name={'password'}
                    label={'Пароль'}
                    rules={[
                        { required: true, message: 'Введите пароль' }
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                { }

                <Flex vertical gap={8}>
                    <Button htmlType='submit' type='primary' style={{ width: 'max-content' }}>Войти</Button>
                    <Flex gap={8}>
                        <Typography.Text>Еще не зарегистрированы? </Typography.Text>
                        <NavLink to={'/registration'}>Регистрация</NavLink>
                    </Flex>
                </Flex>
            </Form>
        </Card>
    </Flex>
}
