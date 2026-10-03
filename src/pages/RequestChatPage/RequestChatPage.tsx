import { Cell, List, IconButton, Spinner, Badge, Modal, Text, Button } from '@telegram-apps/telegram-ui';
import { MediaAvatar } from '@/components/MediaAvatar';
import type { FC } from 'react';
import { Page } from '@/components/Page.tsx';
import { Icon16Chevron, Icon20Select, Icon24Cancel, Icon24ChevronLeft } from 'tmaui/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { themeParams } from '@telegram-apps/sdk-react';
import { ChatBubble } from '@/components/ChatBubble/ChatBubble';
import { useGetRequestChatByIdQuery, useVoteMutation } from '@/services/request-chat.service';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { retryMessage, sendMessage as sendOptimistic } from '@/services/live-updates';
import { initials, wrapLastText } from '@/helpers/text';
import { formatChatTime } from '@/helpers/date';

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
    const [messageContent, setMessageContent] = useState<string>('');
    const [showModal, setShowModal] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const handleNavigateBack = () => {
        if (isRequesterTheViewer) return;
        navigate(-1);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = () => {
        if (requestChat && messageContent.trim() !== '') {
            // Aparece al instante como "enviando"; el autor lo decide la API con el initData.
            dispatch(sendOptimistic(requestChat.uuid, messageContent));
            setMessageContent('');
            scrollToBottom();
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

    useEffect(() => {
        scrollToBottom();
    }, [requestChat?.messages, pending.length]);

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
                <Cell
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
                </Cell>
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        backgroundColor: themeParams.backgroundColor(),
                        minHeight: 0,
                    }}
                >
                    <List style={{ flex: 1, padding: '16px', overflowY: 'auto' }} >
                        {requestChat.messages.map((message) => {
                            return (
                                <ChatBubble
                                    key={message.uuid}
                                    message={message.content}
                                    avatarMediaId={message.user.avatarMediaId}
                                    username={message.user.username!}
                                    isOwn={message.user.uuid === user?.uuid}
                                    time={formatChatTime(message.sentAt)}
                                />
                            )
                        })}
                        {user && pending.map((message) => (
                            <ChatBubble
                                key={message.clientMessageId}
                                message={message.content}
                                avatarMediaId={user.avatarMediaId}
                                username={user.username ?? user.name}
                                isOwn
                                time={formatChatTime(message.sentAt)}
                                status={message.status}
                                onRetry={() => dispatch(retryMessage(message.clientMessageId))}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </List>
                </div>
                {
                    requestChat.state === 'InProgress' && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 16px',
                            }}
                        >
                            <input
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    height: '40px',
                                    width: '100%',
                                    color: 'white',
                                    fontFamily: 'var(--tgui--font-family)',
                                }}
                                autoFocus
                                placeholder="Escribe un mensaje..."
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        sendMessage();
                                    }
                                }}
                            />
                            <IconButton
                                mode="bezeled"
                                size="m"
                                onClick={() => sendMessage()}
                            >
                                <Icon16Chevron size={16} />
                            </IconButton>
                        </div>
                    )
                }
            </div>
        </Page>
    );
};
