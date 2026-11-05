import { Avatar, Cell, List, IconButton, Spinner, Text, Button, Caption } from '@telegram-apps/telegram-ui';
import { MediaAvatar } from '@/components/MediaAvatar';
import type { FC } from 'react';
import { Page } from '@/components/Page.tsx';
import { Icon24ChevronLeft } from 'tmaui/icons';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { themeParams } from '@telegram-apps/sdk-react';
import { ChatBubble } from '@/components/ChatBubble/ChatBubble';
import { ChatComposer } from '@/components/ChatComposer/ChatComposer';
import { useGetRequestChatByIdQuery, useLoadOlderMessagesMutation } from '@/services/request-chat.service';
import { VotePanel } from '@/components/VotePanel/VotePanel';
import { RequestChat } from '@/models/request-chat.model';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { type MessageBody, retryMessage, sendMessage as sendOptimistic } from '@/services/live-updates';
import { initials, wrapLastText } from '@/helpers/text';
import { formatChatTime } from '@/helpers/date';

/** Cuánto sigue la vista al fondo tras abrir el chat o enviar: cubre las imágenes que cargan. */
const PIN_TO_BOTTOM_MS = 3_000;
/** Distancia al fondo a partir de la cual se entiende que la persona subió a leer. */
const UNPIN_DISTANCE_PX = 80;

/** Encabezado con el que empieza todo chat (antes era un mensaje del bot, T19). */
const WELCOME_TEXT =
    '¡Hola! En este chat podrás comunicarte con todos los miembros. ¿Qué tal si empiezas por presentarte y contarnos un poco sobre ti?';

export const RequestChatPage: FC = () => {
    const params = useParams<{ uuid: string }>();
    // Se pide al abrir; después lo mantienen al día los eventos del socket compartido.
    const {
        data: requestChat,
        error,
        isError,
        isLoading,
        refetch,
    } = useGetRequestChatByIdQuery(params.uuid!);
    const dispatch = useDispatch<AppDispatch>();
    const user = useSelector((state: RootState) => state.user);
    const outbox = useSelector((state: RootState) => state.outbox);
    // Mensajes propios aún sin confirmar de este chat, al final.
    const pending = useMemo(
        () => outbox.filter((m) => m.requestChatUUID === params.uuid),
        [outbox, params.uuid],
    );
    const me = useSelector((state: RootState) => state.me);
    const [loadOlder, { isLoading: isLoadingOlder }] = useLoadOlderMessagesMutation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    /** Alto del historial antes de agregar mensajes anteriores, para no mover la vista. */
    const heightBeforeOlder = useRef<number | null>(null);
    /**
     * Hasta cuándo la vista sigue al fondo aunque el contenido crezca: el mensaje propio
     * que se agrega después de enviarlo y las imágenes que terminan de cargar.
     */
    const pinnedUntil = useRef(0);
    const navigate = useNavigate();

    const handleNavigateBack = () => {
        navigate(-1);
    };

    const scrollToEnd = () => {
        const container = scrollRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    };

    const pinToBottom = () => {
        pinnedUntil.current = Date.now() + PIN_TO_BOTTOM_MS;
        scrollToEnd();
    };

    // Si la persona sube para leer, la vista deja de seguir al fondo.
    const handleScroll = () => {
        const container = scrollRef.current;
        if (container && container.scrollHeight - container.scrollTop - container.clientHeight > UNPIN_DISTANCE_PX) {
            pinnedUntil.current = 0;
        }
    };

    const sendMessage = (body: MessageBody) => {
        if (requestChat) {
            // Aparece al instante como "enviando"; el autor lo decide la API con el initData.
            dispatch(sendOptimistic(requestChat.uuid, body));
            pinToBottom();
        }
    };

    // Quien ya entró al grupo ve su propia solicitud como cualquier miembro (SPEC §3.3).
    const isMember = me?.role === 'member';
    const isOwnRequest = user?.uuid === requestChat?.requester.uuid;

    const handleLoadOlder = () => {
        const first = requestChat?.messages[0];
        if (requestChat && first && !isLoadingOlder) {
            pinnedUntil.current = 0;
            heightBeforeOlder.current = scrollRef.current?.scrollHeight ?? null;
            void loadOlder({ id: requestChat.uuid, before: first.uuid });
        }
    };

    // Al abrir el chat se ve lo último. Los mensajes que llegan después no mueven la vista;
    // solo baja al enviar uno propio (`sendMessage`).
    const chatId = requestChat?.uuid;
    useEffect(() => {
        if (chatId) {
            pinToBottom();
        }
    }, [chatId]);

    // Mientras la vista está fijada al fondo, lo sigue cada vez que el contenido crece.
    useEffect(() => {
        const content = contentRef.current;
        if (!content) {
            return;
        }
        const observer = new ResizeObserver(() => {
            if (Date.now() < pinnedUntil.current) {
                scrollToEnd();
            }
        });
        observer.observe(content);
        return () => observer.disconnect();
    }, [chatId]);

    // Al agregar mensajes anteriores, se mantiene a la vista el mismo mensaje.
    const firstMessageId = requestChat?.messages[0]?.uuid;
    useLayoutEffect(() => {
        const container = scrollRef.current;
        if (container && heightBeforeOlder.current !== null) {
            container.scrollTop += container.scrollHeight - heightBeforeOlder.current;
            heightBeforeOlder.current = null;
        }
    }, [firstMessageId]);

    // No existe o no puede verla (por ejemplo, un enlace `startapp` viejo): al inicio.
    if (!requestChat && error && 'status' in error && [400, 403, 404].includes(error.status as number)) {
        return <Navigate to="/" replace />;
    }
    if (isError && !requestChat) {
        return <Page back={true}>Error loading chat. <button onClick={() => void refetch()}>Retry</button></Page>;
    }
    if (isLoading || !requestChat) {
        return <Page back={true}>
            <div style={{
                flex: 1,
                height: '100dvh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Spinner size='m' />
            </div>
        </Page>;
    }

    return (
        <Page back={isMember}>
            <div
                style={{
                    height: '100dvh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                {!isMember ? <RequesterHeader /> : <Cell
                    style={{
                        padding: '0 4px',
                        gap: '8px'
                    }}
                    before={
                        <div
                            style={{
                                display: 'flex',
                            }}
                        >
                            <IconButton mode='plain' onClick={handleNavigateBack}>
                                <Icon24ChevronLeft size={24} />
                            </IconButton>
                            <MediaAvatar
                                size={40}
                                mediaId={requestChat.requester.avatarMediaId}
                                acronym={initials(requestChat.requester.name)}
                            />
                        </div>
                    }
                    type='section'
                    subtitle={requestChat.requester.username}
                >
                    {wrapLastText(20, requestChat.requester.name)}
                </Cell>}
                {isMember && (
                    <SummaryCard
                        requestChat={requestChat}
                        onOpen={() => navigate(`/request-chat/${requestChat.uuid}/summary`, { state: { fromChat: true } })}
                    />
                )}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        backgroundColor: themeParams.backgroundColor(),
                        minHeight: 0,
                    }}
                >
                    <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto' }}>
                        <div ref={contentRef}>
                            <List style={{ padding: '16px' }} >
                                {requestChat.hasOlderMessages ? (
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <Button mode='plain' size='s' loading={isLoadingOlder} onClick={handleLoadOlder}>
                                            Ver mensajes anteriores
                                        </Button>
                                    </div>
                                ) : (
                                    // El inicio del chat: la bienvenida es parte de la App, no un mensaje.
                                    <div
                                        style={{
                                            margin: '0 auto 16px',
                                            maxWidth: '320px',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            backgroundColor: themeParams.secondaryBackgroundColor(),
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Caption>{WELCOME_TEXT}</Caption>
                                    </div>
                                )}
                                {requestChat.messages.map((message) => {
                                    return (
                                        <ChatBubble
                                            key={message.uuid}
                                            message={message.content}
                                            imageIds={message.imageIds}
                                            authorId={message.user.uuid}
                                            avatarMediaId={message.user.avatarMediaId}
                                            username={message.user.username ?? message.user.name}
                                            isOwn={message.user.uuid === user?.uuid}
                                            time={formatChatTime(message.sentAt)}
                                        />
                                    )
                                })}
                                {user && pending.map((message) => (
                                    <ChatBubble
                                        key={message.clientMessageId}
                                        message={message.content}
                                        imageIds={message.imageIds}
                                        authorId={user.uuid}
                                        avatarMediaId={user.avatarMediaId}
                                        username={user.username ?? user.name}
                                        isOwn
                                        time={formatChatTime(message.sentAt)}
                                        status={message.status}
                                        onRetry={() => dispatch(retryMessage(message.clientMessageId))}
                                    />
                                ))}
                            </List>
                        </div>
                    </div>
                </div>
                {isMember && requestChat.votes && requestChat.thresholds && (
                    <VotePanel
                        requestChatId={requestChat.uuid}
                        requesterName={requestChat.requester.name}
                        state={requestChat.state}
                        votes={requestChat.votes}
                        thresholds={requestChat.thresholds}
                        userVote={requestChat.userVote}
                        isOwn={isOwnRequest}
                    />
                )}
                {requestChat.state === 'InProgress' ? (
                    <ChatComposer onSend={sendMessage} />
                ) : (
                    // Solo lectura tras el cierre (SPEC §3.2): sin caja de texto.
                    <div
                        style={{
                            padding: '14px 16px',
                            textAlign: 'center',
                            borderTop: `1px solid ${themeParams.sectionSeparatorColor()}`,
                            flexShrink: 0,
                        }}
                    >
                        <Caption style={{ color: themeParams.hintColor() }}>
                            La solicitud se cerró: el chat es de solo lectura.
                        </Caption>
                    </div>
                )}
            </div>
        </Page>
    );
};

/** "Zorro ártico · 22 años · Medellín · 3 avales": lo que haya de eso. */
function summaryLine({ form, endorsements }: RequestChat): string {
    const count = endorsements?.length ?? 0;
    return [
        form?.species,
        form && `${form.age} años`,
        form?.city,
        count === 1 ? '1 aval' : `${count} avales`,
    ].filter(Boolean).join(' · ');
}

/** Tarjeta del chat de miembros que abre el Resumen (artboard *Main*). */
const SummaryCard: FC<{ requestChat: RequestChat; onOpen: () => void }> = ({ requestChat, onOpen }) => (
    <div style={{ flexShrink: 0, padding: '8px 12px', borderBottom: `1px solid ${themeParams.sectionSeparatorColor()}` }}>
        <button
            type="button"
            aria-label={`Ver el resumen completo de ${requestChat.requester.name}`}
            onClick={onOpen}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minHeight: '52px',
                padding: '8px 12px',
                border: 0,
                borderRadius: '12px',
                background: themeParams.secondaryBackgroundColor(),
                color: themeParams.textColor(),
                fontFamily: 'var(--tgui--font-family)',
                textAlign: 'left',
                cursor: 'pointer',
            }}
        >
            <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Resumen del solicitante</span>
                <span style={{ fontSize: '12px', lineHeight: '16px', color: themeParams.subtitleTextColor(), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {summaryLine(requestChat)}
                </span>
            </span>
            <span style={{ flexShrink: 0, fontSize: '12px', fontWeight: 600, color: themeParams.accentTextColor() }}>Ver</span>
        </button>
    </div>
);

/**
 * Cabecera del chat del solicitante (artboard *Solicitante*): con quién habla y en qué
 * paso está. Sin votación (SPEC §3.3).
 */
const RequesterHeader: FC = () => (
    <div style={{ flexShrink: 0, borderBottom: `1px solid ${themeParams.sectionSeparatorColor()}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '56px', padding: '0 16px' }}>
            <Avatar size={40} acronym='FM' />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <Text weight='2'>FurMeets · tu solicitud</Text>
                <Caption style={{ color: themeParams.hintColor() }}>Conversación con los miembros</Caption>
            </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Caption weight='2' style={{ flexGrow: 1, color: themeParams.accentTextColor() }}>
                    Paso 2 de 3 · conversación con el grupo
                </Caption>
                <Caption level='2' style={{ color: themeParams.hintColor() }}>en revisión</Caption>
            </div>
            <div style={{ display: 'flex', gap: '4px' }} aria-hidden>
                {[true, true, false].map((done, i) => (
                    <div
                        key={i}
                        style={{
                            flexGrow: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: done ? themeParams.accentTextColor() : themeParams.sectionSeparatorColor(),
                        }}
                    />
                ))}
            </div>
        </div>
    </div>
);
