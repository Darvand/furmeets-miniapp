import { Avatar, Caption, Headline, IconButton, Section, Title, Tooltip } from '@telegram-apps/telegram-ui';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { useLazyGetUserByTelegramUserQuery } from '@/services/user.service';
import { useGetAllRequestChatsQuery } from '@/services/request-chat.service';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import {
  initDataRaw as _initDataRaw,
  initDataState as _initDataState,
  themeParams,
  useSignal,
} from '@telegram-apps/sdk-react';
import { LoadingPage } from '../LoadingPage';
import { io, Socket } from 'socket.io-client';
import { RequestChatMessage } from '@/models/request-chat-message.model';
import { RequestChatList } from '@/components/RequestChatList/RequestChatList';
import { FAQ } from '@/components/FAQ/FAQ';
import { Icon20QuestionMark } from 'tmaui/icons';

export const IndexPage: FC = () => {
  const navigate = useNavigate();
  const initDataState = useSignal(_initDataState);
  const [isRequester] = useState(false);
  const { isLoading: isRequestChatsLoading, refetch } = useGetAllRequestChatsQuery();
  const requestChats = useSelector((state: RootState) => state.hub.requestChats);
  const user = useSelector((state: RootState) => state.user);
  const group = useSelector((state: RootState) => state.hub.group);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toolTipRef, setToolTipRef] = useState<HTMLElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const authenticate = useCallback(() => {
    const socket = io(`${import.meta.env.VITE_API_URL}`);
    setSocket(socket);

    socket.on('request-chat', (_: RequestChatMessage) => {
      refetch();
    })

    socket.on('request-chat-update', (_: RequestChatMessage) => {
      refetch();
    });

    socket.on('new-request-chat', (_: RequestChatMessage) => {
      refetch();
    });

    return socket;
  }, []);

  useEffect(() => {
    const socket = authenticate();
    return () => {
      socket.disconnect();
    };
  }, [authenticate]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const telegramUserId = initDataState?.user?.id || 1;
  const [getUserByTelegramUser, { isLoading: isGettingUser }] = useLazyGetUserByTelegramUserQuery();

  const isLoading = useMemo(() => {
    return isGettingUser || isRequestChatsLoading || !socket;
  }, [isGettingUser, isRequestChatsLoading, socket]);

  const requestChatsInProgress = useMemo(() => {
    return requestChats.filter(rc => rc.state === 'InProgress');
  }, [requestChats]);

  const requestChatsCompleted = useMemo(() => {
    return requestChats.filter(rc => rc.state !== 'InProgress');
  }, [requestChats]);

  useEffect(() => {
    if (isRequester) {
      getUserByTelegramUser({ id: 123456789 } as any);
    } else {
      getUserByTelegramUser(initDataState!.user!);
    }
  }, [isRequester, telegramUserId, getUserByTelegramUser]);
  const handleNavigateToChat = (requestChatId: string) => {
    navigate(`/request-chat/${requestChatId}`);
  };

  if (!user || isLoading || !group) {
    return (
      <Page back={false}>
        <LoadingPage />
      </Page>
    );
  }

  if (requestChats.length === 0) {
    return (
      <Page back={false}>
        <div style={{
          flex: 1,
          height: '100dvh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Title>No hay solicitudes de chat disponibles.</Title>
        </div>
      </Page>
    );
  }

  return (
    <Page back={false}>
      <Section
        style={{
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
        footer={<div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px'
        }}>
          <Caption style={{ color: themeParams.subtitleTextColor(), textAlign: 'center' }}>Desarrollado por <a href="https://t.me/DarvandFrovonwill" style={{ color: themeParams.accentTextColor() }} target="_blank" rel="noopener noreferrer">@DarvandFrovonwill</a></Caption>
        </div>}>
        {/* <Cell
          Component="label"
          after={<Switch checked={isRequester} onClick={() => setIsRequester(!isRequester)} readOnly />}
          description="Simula ser el solicitante o tu mismo usuario"
        >
          {isRequester ? 'Simulando' : user.username}
        </Cell> */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 0px',
            backgroundColor: themeParams.secondaryBackgroundColor(),
          }}
        >
          <Avatar size={48} src={group.photoUrl} />
          <Headline weight="3">{group.name}</Headline>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Caption style={{ color: themeParams.subtitleTextColor(), textAlign: 'center' }}>{group.members.length} miembros registrados</Caption>
            <IconButton mode='plain' style={{ color: themeParams.subtitleTextColor() }} ref={setToolTipRef} onClick={() => setShowTooltip(!showTooltip)}>
              <Icon20QuestionMark />
            </IconButton>
            {showTooltip && (
              <Tooltip targetRef={{ current: toolTipRef }} style={{ width: '100px' }} placement='top'>
                <Caption>Numero de miembros que han interactuado con la miniapp y estan registrados en el sistema.</Caption>
              </Tooltip>
            )}
          </div>
        </div>
        <div>
          <RequestChatList
            requestChats={requestChatsInProgress}
            onSelect={(chat) => handleNavigateToChat(chat.uuid)}
            type='InProgress'
          />
          <RequestChatList
            requestChats={requestChatsCompleted}
            onSelect={(chat) => handleNavigateToChat(chat.uuid)}
            type='Completed'
          />
        </div>
        <FAQ />
      </Section>
      {/* <Button onClick={handleNavigateToUserProfile}>Go to User Profile</Button> */}
    </Page>
  );
};
