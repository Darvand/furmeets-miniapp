import type { ComponentType, JSX } from 'react';

import { RegisterPage } from '@/pages/RegisterPage/RegisterPage';
import { RequestChatPage } from '@/pages/RequestChatPage/RequestChatPage';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/register', Component: RegisterPage, title: 'Register' },
  { path: '/request-chat/:uuid', Component: RequestChatPage, title: 'Request Chat' },
];
