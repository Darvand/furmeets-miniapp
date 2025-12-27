import { Cell, List, Avatar, IconButton, Spinner, Badge } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';
import { Page } from '@/components/Page.tsx';
import { Icon16Chevron, Icon20Select, Icon24Cancel, Icon24ChevronLeft } from 'tmaui/icons';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { themeParams } from '@telegram-apps/sdk-react';
import { ChatBubble } from '@/components/ChatBubble/ChatBubble';
import { io, Socket } from "socket.io-client";
import { useGetRequestChatByIdQuery, useVoteMutation } from '@/services/request-chat.service';
import { useNavigate, useParams } from 'react-router-dom';
import { RequestChatMessage } from '@/models/request-chat-message.model';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, setRequestChat } from '@/state/request-chat.slice';
import { RootState } from '@/state/store';
import { RequestChat } from '@/models/request-chat.model';

export const RequestChatPage: FC = () => {
    const params = useParams<{ uuid: string }>();
    const {
        isError,
        isLoading,
        refetch,
    } = useGetRequestChatByIdQuery(params.uuid!);
    const dispatch = useDispatch();
    const requestChat = useSelector((state: RootState) => state.requestChat);
    const user = useSelector((state: RootState) => state.user);
    const [vote] = useVoteMutation();
    const [socket, setSocket] = React.useState<Socket | null>(null);
    const [messageContent, setMessageContent] = React.useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const handleNavigateBack = () => {
        navigate(-1);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const authenticate = useCallback(() => {
        const socket = io(`${import.meta.env.VITE_API_URL}`);
        setSocket(socket);

        socket.on('request-chat', (message: RequestChatMessage) => {
            dispatch(addMessage(message));
        })

        socket.on('request-chat-update', (requestChat: RequestChat) => {
            dispatch(setRequestChat(requestChat));
        })

        return socket;
    }, [dispatch]);

    useEffect(() => {
        const socket = authenticate();
        scrollToBottom();

        return () => {
            socket.disconnect();
        };
    }, [authenticate]);

    const sendMessage = () => {
        if (socket && requestChat && user) {
            socket.emit('request-chat', {
                requestChatUUID: requestChat.uuid,
                userUUID: user.uuid,
                content: messageContent,
            });
            setMessageContent('');
            scrollToBottom();
        }
    };

    const handleApprove = () => {
        if (requestChat) {
            vote({ id: requestChat.uuid, type: 'approve' });
        }
    }

    const handleReject = () => {
        if (requestChat) {
            vote({ id: requestChat.uuid, type: 'reject' });
        }
    }

    const isRequesterTheViewer = useMemo(() => {
        return user?.uuid === requestChat?.requester.uuid;
    }, [user?.uuid, requestChat?.requester.uuid]);

    useEffect(() => {
        if (requestChat) {
            scrollToBottom();
        }
    }, [requestChat?.messages]);

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
        return <Page back={true}>Error loading chat. <button onClick={() => refetch()}>Retry</button></Page>;
    }

    return (
        <Page back={true}>
            <div
                style={{
                    height: '100dvh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
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
                            <Avatar
                                size={40}
                                src={requestChat.requester.avatarUrl}
                            />
                        </div>
                    }
                    type='section'
                    subtitle={requestChat.requester.username}
                    after={
                        !isRequesterTheViewer && (
                            <div
                                style={{
                                    paddingRight: '12px'
                                }}
                            >
                                <IconButton
                                    style={{ position: "relative" }}
                                    onClick={() => handleApprove()}
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
                                    onClick={() => handleReject()}
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
                    {requestChat.requester.name}
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
                                    avatarUrl={message.user.avatarUrl}
                                    username={message.user.username!}
                                    isOwn={message.user.uuid === user?.uuid}
                                    time={message.sentAt}
                                />
                            )
                        })}
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
