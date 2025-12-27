import type { ComponentType, JSX } from 'react';

import { IndexPage } from '@/pages/IndexPage/IndexPage';

interface Route {
    path: string;
    Component: ComponentType;
    title?: string;
    icon?: JSX.Element;
}

export const privateRoutes: Route[] = [
    { path: '/', Component: IndexPage }
];
