import { Avatar, Cell, List, Section, Spinner, Switch } from '@telegram-apps/telegram-ui';
import { useEffect, useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { useLazyGetUserByTelegramUserQuery } from '@/services/user.service';
import { useGetAllRequestChatsQuery } from '@/services/request-chat.service';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import {
  initDataRaw as _initDataRaw,
  initDataState as _initDataState,
  useSignal,
} from '@telegram-apps/sdk-react';

export const IndexPage: FC = () => {
  const navigate = useNavigate();
  const initDataState = useSignal(_initDataState);
  const [isRequester, setIsRequester] = useState(false);
  const { isLoading: isRequestChatsLoading } = useGetAllRequestChatsQuery();
  const requestChats = useSelector((state: RootState) => state.hub.requestChats);
  const user = useSelector((state: RootState) => state.user);

  const telegramUserId = initDataState?.user?.id || 1;
  const [getUserByTelegramUser, { isLoading: isGettingUser }] = useLazyGetUserByTelegramUserQuery();

  const isLoading = useMemo(() => {
    return isGettingUser || isRequestChatsLoading;
  }, [isGettingUser, isRequestChatsLoading]);

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

  // const handleNavigateToUserProfile = () => {
  //   navigate('/init-data');
  // }

  if (!user || isLoading) {
    return (
      <Page back={false}>
        <div style={{
          flex: 1,
          height: '100dvh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spinner size='m' />
        </div>
      </Page>
    );
  }

  return (
    <Page back={false}>
      <Section>
        <Cell
          Component="label"
          after={<Switch checked={isRequester} onClick={() => setIsRequester(!isRequester)} />}
          description="Simula ser el solicitante o tu mismo usuario"
        >
          {isRequester ? 'Simulando' : user.username}
        </Cell>
        <List>
          {requestChats.map((chat) => (
            <Cell
              key={chat.uuid}
              before={<Avatar
                size={40}
                src={chat.requester.avatarUrl}
              />}
              subtitle={chat.requester.username}
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
