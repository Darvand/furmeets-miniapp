import { Button, IconButton, Modal, Placeholder } from '@telegram-apps/telegram-ui';
import { MediaAvatar } from '@/components/MediaAvatar';
import { useEffect, useMemo, useState, type CSSProperties, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { useListRequestChatsQuery, useLoadMoreRequestChatsMutation } from '@/services/request-chat.service';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { themeParams } from '@telegram-apps/sdk-react';
import { LoadingPage } from '../LoadingPage';
import { ClosedRequestChatRow, OpenRequestChatRow, RequestChatSection } from '@/components/RequestChatList/RequestChatList';
import { FAQ } from '@/components/FAQ/FAQ';
import { Icon20QuestionMark } from 'tmaui/icons';
import { initials } from '@/helpers/text';
import { RequestChatItem, RequestChatTotals } from '@/models/request-chat.model';
import { takeStartRequestChatId } from '@/navigation/start-param';

const Stat: FC<{ value: number; label: string; style?: CSSProperties }> = ({ value, label, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', ...style }}>
    <span style={{ fontSize: '17px', fontWeight: 600 }}>{value}</span>
    <span style={{ fontSize: '12px', textAlign: 'center', color: themeParams.subtitleTextColor() }}>{label}</span>
  </div>
);

const Stats: FC<{ totals: RequestChatTotals }> = ({ totals }) => {
  const separator = `1px solid ${themeParams.secondaryBackgroundColor()}`;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '8px',
      padding: '12px',
      borderRadius: '12px',
      background: themeParams.sectionBackgroundColor(),
    }}>
      <Stat value={totals.total} label="solicitudes" />
      <Stat value={totals.approved} label="aceptadas" style={{ borderLeft: separator, borderRight: separator }} />
      <Stat value={totals.rejected} label="no aprobadas" />
    </div>
  );
};

export const IndexPage: FC = () => {
  const navigate = useNavigate();
  // Solo se llega aquí como miembro. Los listados se piden una vez y después los mantienen
  // al día los eventos del socket compartido (`live-updates.ts`), sin recargarlos.
  const open = useListRequestChatsQuery('open');
  const closed = useListRequestChatsQuery('closed');
  const [loadMoreOpen, { isLoading: isLoadingMoreOpen }] = useLoadMoreRequestChatsMutation();
  const [loadMoreClosed, { isLoading: isLoadingMoreClosed }] = useLoadMoreRequestChatsMutation();
  const user = useSelector((state: RootState) => state.user);
  const group = useSelector((state: RootState) => state.hub.group);
  const [showFaq, setShowFaq] = useState(false);

  // Una solicitud que se acaba de cerrar sale de aquí al instante; al historial llega cuando
  // el listado termina de pedirse de nuevo.
  const openItems = useMemo(
    () => (open.data?.items ?? []).filter((item) => item.state === 'InProgress'),
    [open.data],
  );

  const handleSelect = (item: RequestChatItem) => {
    navigate(`/request-chat/${item.uuid}`);
  };

  // El enlace de los avisos al grupo abre esa solicitud. Va sobre el inicio, así el botón de
  // volver lleva aquí. Quien no es miembro no llega a esta pantalla: sigue en la suya.
  useEffect(() => {
    const id = takeStartRequestChatId();
    if (id) {
      navigate(`/request-chat/${id}`);
    }
  }, [navigate]);

  if (open.isError && !open.data) {
    return (
      <Page back={false}>
        <Placeholder
          header="No pudimos cargar las solicitudes"
          description="Revisa tu conexión e inténtalo de nuevo."
          action={<Button size="m" mode="bezeled" onClick={() => void open.refetch()}>Reintentar</Button>}
        />
      </Page>
    );
  }

  if (!user || !open.data || !group) {
    return (
      <Page back={false}>
        <LoadingPage />
      </Page>
    );
  }

  return (
    <Page back={false}>
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        // Sin los componentes de texto de telegram-ui, la fuente hay que indicarla.
        fontFamily: 'var(--tgui--font-family)',
        color: themeParams.textColor(),
        background: themeParams.secondaryBackgroundColor(),
      }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minHeight: '56px',
          padding: '0 8px 0 16px',
          background: themeParams.sectionBackgroundColor(),
        }}>
          <MediaAvatar size={28} mediaId={group.photoMediaId} acronym={initials(group.name)} />
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{ fontSize: '16px', fontWeight: 600, lineHeight: '19px' }}>{group.name}</span>
            <span style={{ fontSize: '12px', color: themeParams.subtitleTextColor() }}>{group.members.length} miembros registrados</span>
          </div>
          <IconButton
            mode="plain"
            aria-label="Preguntas frecuentes"
            style={{ color: themeParams.subtitleTextColor() }}
            onClick={() => setShowFaq(true)}
          >
            <Icon20QuestionMark />
          </IconButton>
        </header>

        <Modal open={showFaq} onOpenChange={setShowFaq}>
          <FAQ />
        </Modal>

        <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
          <RequestChatSection
            title="Solicitudes en curso"
            count={open.data.totals.inProgress}
            emptyText="No hay solicitudes en curso"
            hasMore={!!open.data.nextCursor}
            isLoadingMore={isLoadingMoreOpen}
            onLoadMore={() => void loadMoreOpen({ scope: 'open', cursor: open.data!.nextCursor! })}
          >
            {openItems.map((item) => (
              <OpenRequestChatRow
                key={item.uuid}
                item={item}
                thresholds={open.data!.thresholds}
                viewerUuid={user.uuid}
                onSelect={handleSelect}
              />
            ))}
          </RequestChatSection>

          <Stats totals={open.data.totals} />

          <RequestChatSection
            title="Historial"
            isLoading={closed.isLoading}
            emptyText={closed.isError ? 'No pudimos cargar el historial' : 'Todavía no hay solicitudes cerradas'}
            hasMore={!!closed.data?.nextCursor}
            isLoadingMore={isLoadingMoreClosed}
            onLoadMore={() => void loadMoreClosed({ scope: 'closed', cursor: closed.data!.nextCursor! })}
          >
            {(closed.data?.items ?? []).map((item) => (
              <ClosedRequestChatRow key={item.uuid} item={item} onSelect={handleSelect} />
            ))}
          </RequestChatSection>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
            <a
              href="https://t.me/DarvandFrovonwill"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: themeParams.accentTextColor() }}
            >
              Desarrollado por @DarvandFrovonwill
            </a>
          </div>
        </main>
      </div>
    </Page>
  );
};
