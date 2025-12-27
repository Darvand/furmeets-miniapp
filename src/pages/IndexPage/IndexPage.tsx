import { Avatar, Badge, Caption, Cell, List, Section, Switch } from '@telegram-apps/telegram-ui';
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
import { wrapLastText } from '@/helpers/text';
import { io, Socket } from 'socket.io-client';
import { RequestChatMessage } from '@/models/request-chat-message.model';

export const IndexPage: FC = () => {
  const navigate = useNavigate();
  const initDataState = useSignal(_initDataState);
  const [isRequester, setIsRequester] = useState(false);
  const { isLoading: isRequestChatsLoading, refetch } = useGetAllRequestChatsQuery();
  const requestChats = useSelector((state: RootState) => state.hub.requestChats);
  const user = useSelector((state: RootState) => state.user);
  const [socket, setSocket] = useState<Socket | null>(null);
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

  if (!user || isLoading) {
    return (
      <Page back={false}>
        <LoadingPage />
      </Page>
    );
  }

  return (
    <Page back={false}>
      <Section>
        <Cell
          Component="label"
          after={<Switch checked={isRequester} onClick={() => setIsRequester(!isRequester)} readOnly />}
          description="Simula ser el solicitante o tu mismo usuario"
        >
          {isRequester ? 'Simulando' : user.username}
        </Cell>
        <List>
          {requestChats.map((chat) => (
            <Cell
              key={chat.uuid}
              style={{
                padding: '0 8px',
                gap: '12px'
              }}
              before={<Avatar
                size={40}
                src={chat.requester.avatarUrl}
              />}
              subtitle={
                <div>
                  <Caption style={{ color: themeParams.accentTextColor() }}>{chat.lastMessage.from.name}: </Caption>
                  <Caption>{wrapLastText(30, chat.lastMessage.from.name, chat.lastMessage.content)}</Caption>
                </div>
              }
              after={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Caption>{chat.lastMessage.at}</Caption>
                  <Badge mode="gray" type="number">{chat.unreadMessagesCount}</Badge>
                </div>
              }
              onClick={() => handleNavigateToChat(chat.uuid)}
            >
              {chat.requester.name}
            </Cell>
          ))}
        </List>
      </Section>
      {/* <Button onClick={handleNavigateToUserProfile}>Go to User Profile</Button> */}
    </Page>
  );
};
