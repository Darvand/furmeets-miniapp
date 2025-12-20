import { Avatar, Button, Cell, List, Spinner, Switch } from '@telegram-apps/telegram-ui';
import { useEffect, useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { useCreateUserMutation, useGetUserByIdQuery } from '@/services/user.service';
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
  const { isLoading: isGettingUser, isError, error, refetch: refetchUser } = useGetUserByIdQuery(telegramUserId);
  const { isLoading: isGettingRequester, error: requesterError, refetch: refetchRequester } = useGetUserByIdQuery(123456789);
  const [createUser, { isLoading: isCreatingUser, error: createUserError }] = useCreateUserMutation();

  const isLoading = useMemo(() => {
    return isGettingUser || isCreatingUser || isRequestChatsLoading || isGettingRequester;
  }, [isGettingUser, isCreatingUser, isRequestChatsLoading, isGettingRequester]);

  useEffect(() => {
    // If user not found (404), create the user
    if (isError && error && 'status' in error && error.status === 404) {
      const newUser = {
        telegramId: telegramUserId,
        username: initDataState?.user?.username || 'Unknown',
        name: `${initDataState?.user?.first_name || ''} ${initDataState?.user?.last_name || ''}`.trim(),
        avatarUrl: initDataState?.user?.photo_url || '',
      };
      createUser(newUser);
    }
  }, [isError, error, createUser, telegramUserId, initDataState]);

  useEffect(() => {
    if (isRequester) {
      refetchRequester();
    } else {
      refetchUser();
    }
  }, [isRequester, refetchRequester, refetchUser]);

  const handleNavigateToChat = (requestChatId: string) => {
    navigate(`/request-chat/${requestChatId}`);
  };

  const handleNavigateToUserProfile = () => {
    navigate('/init-data');
  }

  if (error || createUserError || requesterError) {
    const err = error || createUserError || requesterError;
    return (
      <Page back={false}>
        <div>Error loading data. Please try again later.</div>
        <div>{JSON.stringify(err)}</div>
      </Page>
    );
  }

  if (!user) {
    return (
      <Page back={false}>
        <Spinner size='m' />
      </Page>
    );
  }

  return (
    <Page back={false}>
      <Cell
        Component="label"
        after={<Switch checked={isRequester} onClick={() => setIsRequester(!isRequester)} />}
        description="Simula como si hicieras la peticion o fueras el solicitante"
      >
        {isRequester ? 'Simulando' : user.username}
      </Cell>
      {(isLoading && user) ? (
        <Spinner size='m' />
      ) : (
        <List>
          {requestChats.map((chat) => (
            <Cell
              key={chat.uuid}
              before={<Avatar
                size={40}
                src={chat.requester.avatarUrl}
              />}
              subtitle={chat.requester.name}
              onClick={() => handleNavigateToChat(chat.uuid)}
            >
              {chat.requester.name}'s Chat
            </Cell>
          ))}
        </List>
      )}
      <Button onClick={handleNavigateToUserProfile}>Go to User Profile</Button>
    </Page>
  );
};
