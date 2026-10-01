import { Avatar, Caption, Headline, IconButton, Section, Tooltip } from '@telegram-apps/telegram-ui';
import { useEffect, useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { useGetAllRequestChatsQuery } from '@/services/request-chat.service';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { themeParams } from '@telegram-apps/sdk-react';
import { LoadingPage } from '../LoadingPage';
import { createSocket } from '@/services/api';
import { RequestChatList } from '@/components/RequestChatList/RequestChatList';
import { FAQ } from '@/components/FAQ/FAQ';
import { Icon20QuestionMark } from 'tmaui/icons';
import { initials } from '@/helpers/text';

export const IndexPage: FC = () => {
  const navigate = useNavigate();
  // Solo se llega aquí como miembro: el listado se pide al montar, una sola vez.
  const { isLoading: isRequestChatsLoading, refetch } = useGetAllRequestChatsQuery();
  const requestChats = useSelector((state: RootState) => state.hub.requestChats);
  const user = useSelector((state: RootState) => state.user);
  const group = useSelector((state: RootState) => state.hub.group);
  const [toolTipRef, setToolTipRef] = useState<HTMLElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  // Actualiza el listado cuando hay actividad (T42 lo cambia por parches sin recargar).
  useEffect(() => {
    const socket = createSocket();
    socket.on('request-chat', () => refetch());
    socket.on('request-chat-update', () => refetch());
    socket.on('new-request-chat', () => refetch());
    return () => {
      socket.disconnect();
    };
  }, [refetch]);

  const requestChatsInProgress = useMemo(() => {
    return requestChats.filter(rc => rc.state === 'InProgress');
  }, [requestChats]);

  const requestChatsCompleted = useMemo(() => {
    return requestChats.filter(rc => rc.state !== 'InProgress');
  }, [requestChats]);

  const handleNavigateToChat = (requestChatId: string) => {
    navigate(`/request-chat/${requestChatId}`);
  };

  if (!user || isRequestChatsLoading || !group) {
    return (
      <Page back={false}>
        <LoadingPage />
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 0px',
            backgroundColor: themeParams.secondaryBackgroundColor(),
          }}
        >
          <Avatar size={48} src={group.photoUrl} acronym={initials(group.name)} />
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
    </Page>
  );
};
