import { lazy, type ComponentType, type JSX } from 'react';

import type { RouteAccess } from '@/components/RoleRoute';

// Cada página es su propio chunk: el arranque solo descarga la que abre el usuario.
const IndexPage = lazy(() =>
  import('@/pages/IndexPage/IndexPage').then((m) => ({ default: m.IndexPage })));
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const RequestChatPage = lazy(() =>
  import('@/pages/RequestChatPage/RequestChatPage').then((m) => ({ default: m.RequestChatPage })));
const ApprovedPage = lazy(() =>
  import('@/pages/ApprovedPage').then((m) => ({ default: m.ApprovedPage })));
const NotApprovedPage = lazy(() =>
  import('@/pages/NotApprovedPage').then((m) => ({ default: m.NotApprovedPage })));

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
