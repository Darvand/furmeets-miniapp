import { lazy, type ComponentType, type JSX } from 'react';

import type { RouteAccess } from '@/components/RoleRoute';
import { homePathFor } from './role-home';

// Cada página es su propio chunk: el arranque solo descarga la que abre el usuario.
const IndexPage = lazy(() =>
  import('@/pages/IndexPage/IndexPage').then((m) => ({ default: m.IndexPage })));
const WelcomePage = lazy(() =>
  import('@/pages/WelcomePage').then((m) => ({ default: m.WelcomePage })));
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
const isApplicantWithoutRequest: RouteAccess = (me) =>
  me.role === 'applicant' && !me.requestChatId;
const isApplicantWithState = (state: string): RouteAccess => (me) =>
  me.role === 'applicant' && me.requestChatState === state;

export const routes: Route[] = [
  { path: '/', Component: IndexPage, allow: isMember },
  { path: '/welcome', Component: WelcomePage, title: 'Welcome', allow: isApplicantWithoutRequest },
  { path: '/register', Component: RegisterPage, title: 'Register', allow: isApplicantWithoutRequest },
  {
    path: '/request-chat/:uuid',
    Component: RequestChatPage,
    title: 'Request Chat',
    // Un miembro abre cualquier chat; un solicitante, solo el de su solicitud y mientras
    // está en curso. Al cerrarse (en vivo, por `request-chat-update`), pasa a la pantalla
    // del resultado: el chat ya no anuncia el resultado (T19).
    allow: (me, params) =>
      me.role === 'member' || homePathFor(me) === `/request-chat/${params.uuid}`,
  },
  { path: '/approved', Component: ApprovedPage, allow: isApplicantWithState('Approved') },
  { path: '/not-approved', Component: NotApprovedPage, allow: isApplicantWithState('Rejected') },
];
