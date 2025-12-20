import { Cell, List, Avatar, IconButton } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';
import { Page } from '@/components/Page.tsx';
import { Icon16Chevron, Icon20Select, Icon24Cancel, Icon24ChevronLeft } from 'tmaui/icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { themeParams } from '@telegram-apps/sdk-react';
import { ChatBubble } from '@/components/ChatBubble/ChatBubble';
import { io, Socket } from "socket.io-client";
import { useGetRequestChatByIdQuery } from '@/services/request-chat.service';
import { useNavigate, useParams } from 'react-router-dom';
import { RequestChatMessage } from '@/models/request-chat-message.model';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage } from '@/state/request-chat.slice';
import { RootState } from '@/state/store';

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
            console.log('Received message via WebSocket:', message);
            dispatch(addMessage(message));
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

    useEffect(() => {
        if (requestChat) {
            scrollToBottom();
        }
    }, [requestChat?.messages]);

    if (isLoading || !requestChat) {
        return <Page back={false}>Loading...</Page>;
    }
    if (isError) {
        return <Page back={false}>Error loading chat. <button onClick={() => refetch()}>Retry</button></Page>;
    }

    return (
        <Page back={false}>
            <div
                style={{
                    height: '100vh',
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
                        <React.Fragment>
                            <IconButton
                                mode="bezeled"
                                size="s"
                            >
                                <Icon20Select size={24} />
                            </IconButton>
                            <IconButton
                                onClick={() => console.log('Close chat')}
                                mode="plain"
                                size="s"
                            >
                                <Icon24Cancel size={24} />
                            </IconButton>
                        </React.Fragment>
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
                                    username={message.user.username}
                                    isOwn={message.user.uuid === user?.uuid}
                                    time='10:00 AM'
                                />
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </List>
                </div>
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
                        placeholder="Type a message..."
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
            </div>
        </Page>
    );
};
