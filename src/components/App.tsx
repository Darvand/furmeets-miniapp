import { Suspense, useMemo } from 'react';
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { retrieveLaunchParams, useSignal, isMiniAppDark } from '@telegram-apps/sdk-react';
import { AppRoot, Spinner } from '@telegram-apps/telegram-ui';
import { useSelector } from 'react-redux';

import { routes } from '@/navigation/routes.tsx';
import { homePathFor } from '@/navigation/role-home';
import { RoleRoute } from './RoleRoute';
import { LoadingPage } from '@/pages/LoadingPage';
import { StartupErrorPage } from '@/pages/StartupErrorPage';
import { useGetMeQuery } from '@/services/me.service';
import { useGetGroupQuery } from '@/services/group.service';
import { RootState } from '@/state/store';

/** Mientras se descarga el chunk de la página (rutas con `React.lazy`). */
function PageChunkFallback() {
  return (
    <div style={{ height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Spinner size="m" />
    </div>
  );
}

export function App() {
  const lp = useMemo(() => retrieveLaunchParams(), []);
  const isDark = useSignal(isMiniAppDark);
  const me = useSelector((state: RootState) => state.me);

  // Arranque: `GET /me` decide a qué pantalla ir. El grupo no depende del rol (lo usan
  // Inicio y Formulario), así que se pide en paralelo y no en cadena.
  const { isError, isFetching, refetch } = useGetMeQuery();
  useGetGroupQuery();

  let content;
  if (me) {
    content = (
      <Suspense fallback={<PageChunkFallback />}>
        <Routes>
          {routes.map(({ allow, ...route }) => (
            <Route key={route.path} element={<RoleRoute allow={allow} />}>
              <Route {...route} />
            </Route>
          ))}
          <Route path="*" element={<Navigate to={homePathFor(me)} replace />} />
        </Routes>
      </Suspense>
    );
  } else if (isError && !isFetching) {
    content = <StartupErrorPage onRetry={() => void refetch()} />;
  } else {
    content = <LoadingPage />;
  }

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <HashRouter>{content}</HashRouter>
    </AppRoot>
  );
}
