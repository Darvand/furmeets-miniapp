import type { ComponentType, JSX } from 'react';

import type { RouteAccess } from '@/components/RoleRoute';
import { IndexPage } from '@/pages/IndexPage/IndexPage';
import { RegisterPage } from '@/pages/RegisterPage/RegisterPage';
import { RequestChatPage } from '@/pages/RequestChatPage/RequestChatPage';
import { ApprovedPage } from '@/pages/ApprovedPage';
import { NotApprovedPage } from '@/pages/NotApprovedPage';

interface Route {
  path: string;
  Component: ComponentType;
  /** Quién puede ver la ruta según `GET /me`; los demás van a su pantalla de inicio. */
  allow: RouteAccess;
  title?: string;
  icon?: JSX.Element;
}

const isMember: RouteAccess = (me) => me.role === 'member';
const isApplicantWithState = (state: string): RouteAccess => (me) =>
  me.role === 'applicant' && me.requestChatState === state;

export const routes: Route[] = [
  { path: '/', Component: IndexPage, allow: isMember },
  {
    path: '/register',
    Component: RegisterPage,
    title: 'Register',
    allow: (me) => me.role === 'applicant' && !me.requestChatId,
  },
  {
    path: '/request-chat/:uuid',
    Component: RequestChatPage,
    title: 'Request Chat',
    // Un miembro abre cualquier chat; un solicitante, solo el de su solicitud.
    allow: (me, params) => me.role === 'member' || me.requestChatId === params.uuid,
  },
  { path: '/approved', Component: ApprovedPage, allow: isApplicantWithState('Approved') },
  { path: '/not-approved', Component: NotApprovedPage, allow: isApplicantWithState('Rejected') },
];
