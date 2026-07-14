import { useState, type FC } from 'react'



import {

    Button,

    Form,

    Input,

    message,

    Modal,

    Select,

    Typography,

    type SelectProps

} from 'antd'



import { type IMainProps } from './add-user-types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchTeams } from 'core/api/teams-api'

import { instanceAxios } from 'core/api/axios'

import type { IUserCreate } from 'core/types/user'

import { USER_GRADES, USER_GRADE_LABELS, USER_ROLES, USER_ROLE_LABELS } from 'core/types/user'

import type { AxiosError } from 'axios'





export const AddUserComponent: FC<IMainProps> = () => {

    const queryClient = useQueryClient()

    const [isOpen, setIsOpen] = useState(false)

    const [form] = Form.useForm<IUserCreate>()

    const selectedRole = Form.useWatch('role', form)



    const { data: teams = [] } = useQuery({

        queryKey: ['teams'],

        queryFn: fetchTeams,

    })



    const userMutation = useMutation({

        mutationFn: async (user: IUserCreate) => {

            const response = await instanceAxios.post('/api/users', user)

            return response

        },

        onSuccess: () => {

            queryClient.invalidateQueries({ queryKey: ['users'] })

            message.success('Пользователь успешно создан')

            closeHandler()

        },

    })



    const submitHandler = (values: IUserCreate) => {

        const payload: IUserCreate = {
            ...values,
            grade: values.role === 'user' ? values.grade : (values.grade ?? null),
            managed_team_ids: values.role === 'lead' ? values.managed_team_ids ?? [] : [],
        }

        userMutation.mutate(payload)

    }



    const openHandler = () => {

        setIsOpen(true)

    }



    const closeHandler = () => {

        setIsOpen(false)

        form.resetFields()

    }



    const roleOptions: SelectProps['options'] = USER_ROLES.map((role) => ({

        value: role,

        label: USER_ROLE_LABELS[role],

    }))



    const teamOptions: SelectProps['options'] = teams.map((team) => ({

        value: team.id,

        label: team.name,

    }))



    const gradeOptions: SelectProps['options'] = USER_GRADES.map((grade) => ({

        value: grade,

        label: USER_GRADE_LABELS[grade],

    }))



    return <>

        <Button onClick={openHandler}>Добавить пользователя</Button>



        <Modal

            title={'Добавить пользователя'}

            open={isOpen}

            onCancel={closeHandler}

            okButtonProps={{ htmlType: 'submit', form: 'create-user', loading: userMutation.isPending }}

            destroyOnHidden

        >

            <Form<IUserCreate>

                form={form}

                name='create-user'

                onFinish={submitHandler}

                layout='vertical'

                clearOnDestroy

                initialValues={{ grade: 'junior', role: 'user' }}

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

                <Form.Item

                    name={'role'}

                    label={'Роль'}

                >

                    <Select options={roleOptions} />

                </Form.Item>

                <Form.Item

                    name={'job_title'}

                    label={'Должность'}

                >

                    <Input maxLength={150} placeholder='Например, Руководитель направления' />

                </Form.Item>

                <Form.Item

                    name={'team_id'}

                    label={'Команда'}

                >

                    <Select

                        allowClear

                        placeholder='Выберите команду'

                        options={teamOptions}

                    />

                </Form.Item>

                {selectedRole === 'lead' && (

                    <Form.Item

                        name={'managed_team_ids'}

                        label={'Управляемые команды'}

                    >

                        <Select

                            mode='multiple'

                            allowClear

                            placeholder='Выберите команды'

                            options={teamOptions}

                        />

                    </Form.Item>

                )}

                <Form.Item
                    name={'grade'}
                    label={'Грейд'}
                    rules={[
                        {
                            required: selectedRole === 'user',
                            message: 'Выберите грейд',
                        },
                    ]}
                >
                    <Select
                        allowClear={selectedRole !== 'user'}
                        placeholder={selectedRole === 'user' ? undefined : 'Не указан'}
                        options={gradeOptions}
                    />
                </Form.Item>



                {userMutation.isError &&

                    <Typography.Text type='danger'>{(userMutation?.error as AxiosError<{ error: string }>)?.response?.data?.error}</Typography.Text>

                }

            </Form>

        </Modal>

    </>

}


