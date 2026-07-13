import { type FC } from 'react'

import { NavLink, useNavigate } from 'react-router'

import { Button, Card, Flex, Form, Input, message, Typography } from 'antd'
import { instanceAxios } from '../../core/api/axios'
import { AxiosError } from 'axios'
import type { IUserCreate } from '../../core/types/user'


export const RegistrationComponent: FC = () => {
    const navigate = useNavigate()

    const submitHandler = (values: IUserCreate) => {
        instanceAxios
            .post('/api/users', { ...values })
            .then(() => {
                message.success('Вы успешно зарегистрированы')
                navigate('/auth')
            })
            .catch((err: AxiosError<{ error: string }>) => {
                console.error({ err });
                message.error(err?.response?.data?.error)
            })
    }

    return <Flex justify='center' align='center'>
        <Card style={{ width: 600 }}>
            <Form<IUserCreate>
                name='register'
                onFinish={submitHandler}
                layout='vertical'
            >
                <Form.Item
                    name={'login'}
                    label={'Логин'}
                    required
                    rules={[
                        { required: true, message: 'Введите логин' },
                        { pattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/, message: 'Не менее одной буквы и одной цифры' },
                        { min: 6, message: 'Не менее 6 символов' }
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name={'password'}
                    label={'Пароль'}
                    rules={[
                        { required: true, message: 'Введите пароль' },
                        { min: 8, message: 'Не менее 8 символов' }
                    ]}
                    required
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    name={'full_name'}
                    label={'Имя'}
                    rules={[{ required: true, message: 'Введите полное имя' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name={'email'}
                    label={'Почта'}
                    rules={[
                        { required: true, message: 'Введите почту' },
                        { pattern: /^\S+@\S+\.\S+$/, message: 'Некорректный email' }
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name={'phone'}
                    label={'Телефон'}
                    rules={[
                        { pattern: /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/, message: 'Введите телефон в формате 8(XXX)XXX-XX-XX' },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Flex vertical gap={8}>
                    <Button htmlType='submit' type='primary' style={{ width: 'max-content' }}>Зарегистрироваться</Button>
                    <Flex>
                        <Typography.Text>Уже зарегистрированы ? </Typography.Text>
                        <NavLink to={'/auth'}>Войти</NavLink>
                    </Flex>
                </Flex>
            </Form>
        </Card>
    </Flex>
}
