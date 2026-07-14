import {
    type FC,
    type ReactNode,
    Suspense,
    useCallback
} from 'react'

import { Navigate, Route, Routes } from 'react-router'
import { routes } from './app-router-configs'
import { Layout } from '../layout'
import type { IProtectedRouteProps, IRoute } from './app-router-types'

const ProtectedRoute: FC<IProtectedRouteProps> = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user?.role !== 'admin' && user?.role !== 'lead') {
        return <Navigate to="/forbidden" replace />;
    }

    return children;
};

export const AppRouterComponent: FC = () => {
    const renderRoutes: (route: IRoute) => ReactNode = useCallback(({
        path,
        element,
        protect
    }) => {
        return <Route
            key={path}
            path={path}
            element={<Suspense fallback={<div>Loading...</div>}>{
                protect
                    ? <ProtectedRoute>
                        {element}
                    </ProtectedRoute>
                    : element
            }</Suspense>}
        />
    }, [])

    return <Routes>
        <Route path={'/'} element={<Layout />}>
            {routes.map(renderRoutes)}
        </Route>
    </Routes>
}
