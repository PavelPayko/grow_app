import { Auth } from '../auth'
import { Registration } from '../registration'
import { Main } from '../main'
import { NotFound } from '../not-found'
import { AdminPanel } from 'components/admin-panel'
import { Forbidden } from 'components/forbidden'
import { Info } from 'components/info'

export const routes = [
    {
        name: 'admin',
        path: '/admin',
        protect: true,
        element: <AdminPanel />
    },
    {
        name: 'auth',
        path: '/auth',
        element: <Auth />
    },
    {
        name: 'registration',
        path: '/registration',
        element: <Registration />
    },
    {
        name: 'main',
        path: '/',
        element: <Main />
    },
    {
        name: 'info',
        path: '/info',
        element: <Info />
    },
    {
        name: 'not-found',
        path: '*',
        element: <NotFound />
    },
    {
        name: 'forbidden',
        path: '/forbidden',
        element: <Forbidden />
    }
]
