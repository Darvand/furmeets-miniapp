import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import {
  retrieveLaunchParams,
  useSignal,
  isMiniAppDark,
  initDataRaw as _initDataRaw,
  initDataState as _initDataState,
} from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';

import { routes } from '@/navigation/routes.tsx';
import { privateRoutes } from '@/navigation/private-routes';
import { RequireBeMember } from './RequireBeMember';
import { useLazyGetUserByTelegramUserQuery } from '@/services/user.service';
import { useLazyGetGroupQuery, useSyncMutation } from '@/services/group.service';
import { LoadingPage } from '@/pages/LoadingPage';
import { useLazyGetAllRequestChatsQuery } from '@/services/request-chat.service';


export function App() {
  const lp = useMemo(() => retrieveLaunchParams(), []);
  const isDark = useSignal(isMiniAppDark);
  const initDataState = useSignal(_initDataState);
  const hasInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  const [sync] = useSyncMutation();
  const [getUser] = useLazyGetUserByTelegramUserQuery();
  const [getGroup] = useLazyGetGroupQuery();
  const [getRequestChats] = useLazyGetAllRequestChatsQuery();
  useEffect(() => {
    const initState = async () => {
      if (initDataState?.user && !hasInitialized.current) {
        hasInitialized.current = true;
        try {
          await sync();
          await getRequestChats();
          await getGroup();
          await getUser(initDataState.user);
        } catch (error) {
          console.error('Error initializing app:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (!initDataState?.user) {
        setIsLoading(false);
      }
    }
    initState();
  }, [sync, getUser, getGroup, initDataState]);

  if (isLoading) {
    return (
      <AppRoot
        appearance={isDark ? 'dark' : 'light'}
        platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
      >
        <HashRouter>

          <LoadingPage />
        </HashRouter>
      </AppRoot>
    );
  }
  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <HashRouter>
        <Routes>
          {privateRoutes.map((route) => <Route element={<RequireBeMember />}>
            <Route key={route.path} {...route} />
          </Route>)}
          {routes.map((route) => <Route key={route.path} {...route} />)}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AppRoot>
  );
}
