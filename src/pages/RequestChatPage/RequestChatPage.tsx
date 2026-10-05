import { Avatar, Cell, List, IconButton, Spinner, Badge, Modal, Text, Button, Caption } from '@telegram-apps/telegram-ui';
import { MediaAvatar } from '@/components/MediaAvatar';
import type { FC } from 'react';
import { Page } from '@/components/Page.tsx';
import { Icon20Select, Icon24Cancel, Icon24ChevronLeft } from 'tmaui/icons';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { themeParams } from '@telegram-apps/sdk-react';
import { ChatBubble } from '@/components/ChatBubble/ChatBubble';
import { ChatComposer } from '@/components/ChatComposer/ChatComposer';
import { useGetRequestChatByIdQuery, useLoadOlderMessagesMutation, useVoteMutation } from '@/services/request-chat.service';
import { useNavigate, useParams } from 'react-router-dom';
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
    const [vote, { isLoading: isVoting }] = useVoteMutation();
    const [loadOlder, { isLoading: isLoadingOlder }] = useLoadOlderMessagesMutation();
    const [showModal, setShowModal] = useState<string>('');
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
        if (isRequesterTheViewer) return;
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

    // El voto se ve al instante (optimista); si la API lo rechaza, se revierte solo.
    const handleApprove = () => {
        if (requestChat && !isVoting) {
            void vote({ id: requestChat.uuid, type: 'approve' });
            setShowModal('');
        }
    }

    const handleReject = () => {
        if (requestChat && !isVoting) {
            void vote({ id: requestChat.uuid, type: 'reject' });
            setShowModal('');
        }
    }

    const isRequesterTheViewer = useMemo(() => {
        return user?.uuid === requestChat?.requester.uuid;
    }, [user?.uuid, requestChat?.requester.uuid]);

    const showVoteButtons = useMemo(() => {
        return requestChat && !isRequesterTheViewer && requestChat.state === 'InProgress';
    }, [requestChat, isRequesterTheViewer]);

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
    if (isError) {
        return <Page back={true}>Error loading chat. <button onClick={() => void refetch()}>Retry</button></Page>;
    }

    return (
        <Page back={!isRequesterTheViewer}>
            <div
                style={{
                    height: '100dvh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                <Modal
                    open={showModal !== ''}
                >
                    <div style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '16px',
                    }}>
                        {
                            requestChat.userVote === showModal ? (
                                <Text>Estás a punto de retirar tu voto</Text>
                            ) : (
                                <Text>Estás a punto de {showModal === 'approve' ? 'aceptar' : 'rechazar'} al solicitante</Text>
                            )
                        }
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                        }}>
                            <Button mode='gray' onClick={() => setShowModal('')}>Cancelar</Button>
                            <Button onClick={showModal === 'approve' ? handleApprove : handleReject}>
                                Entendido
                            </Button>
                        </div>
                    </div>
                </Modal>
                {isRequesterTheViewer ? <RequesterHeader /> : <Cell
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
                    after={
                        showVoteButtons && (
                            <div
                                style={{
                                    paddingRight: '12px'
                                }}
                            >
                                <IconButton
                                    style={{ position: "relative" }}
                                    onClick={() => setShowModal('approve')}
                                    mode="bezeled"
                                    size="s"
                                >
                                    {requestChat.votes.approved > 0 && (
                                        <Badge type='number' mode='primary' style={{
                                            position: "absolute",
                                            top: -8,
                                            right: -12,
                                        }}>
                                            {requestChat.votes.approved}
                                        </Badge>
                                    )}
                                    {requestChat.userVote === 'approve' && (
                                        <Badge type="dot" mode="white" style={{
                                            position: "absolute",
                                            bottom: -6,
                                            right: -6,
                                        }} />
                                    )}
                                    <Icon20Select size={24} />
                                </IconButton>
                                <IconButton
                                    onClick={() => setShowModal('reject')}
                                    style={{ position: "relative" }}
                                    mode="plain"
                                    size="s"
                                >
                                    {requestChat.votes.rejected > 0 && (
                                        <Badge type='number' mode='critical' style={{
                                            position: "absolute",
                                            top: -8,
                                            right: -12,
                                        }}>
                                            {requestChat.votes.rejected}
                                        </Badge>
                                    )}
                                    {requestChat.userVote === 'reject' && (
                                        <Badge type="dot" mode="white" style={{
                                            position: "absolute",
                                            bottom: -6,
                                            right: -6,
                                        }} />
                                    )}
                                    <Icon24Cancel size={24} />
                                </IconButton>
                            </div>
                        )
                    }
                >
                    {wrapLastText(20, requestChat.requester.name)}
                </Cell>}
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
