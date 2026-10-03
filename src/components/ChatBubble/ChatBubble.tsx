import { themeParams } from "@telegram-apps/sdk-react";
import { Caption } from "@telegram-apps/telegram-ui";
import { FC } from "react";
import { initials } from "@/helpers/text";
import { MediaAvatar } from "@/components/MediaAvatar";

interface ChatBubbleProps {
    message: string;
    username: string;
    time: string;
    avatarMediaId?: string;
    isOwn?: boolean;
    /** Mensaje propio sin confirmar (ver `OutboxMessage`). */
    status?: 'sending' | 'failed';
    onRetry?: () => void;
}

export const ChatBubble: FC<ChatBubbleProps> = ({ message, username, time, avatarMediaId, isOwn, status, onRetry }) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                marginBottom: '12px',
                opacity: status === 'sending' ? 0.7 : 1,
            }}
        >
            <MediaAvatar
                size={40}
                mediaId={avatarMediaId}
                acronym={initials(username)}
            />
            <div
                style={{
                    backgroundColor: isOwn ? themeParams.buttonColor() : themeParams.secondaryBackgroundColor(),
                    borderRadius: '12px',
                    padding: '8px 12px',
                    marginTop: '4px',
                    maxWidth: '60%',
                    marginLeft: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Caption weight='1'>{username}</Caption>
                <Caption>{message}</Caption>
                {status === 'failed' ? (
                    <button
                        type="button"
                        onClick={onRetry}
                        style={{
                            alignSelf: 'flex-end',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: themeParams.destructiveTextColor(),
                        }}
                    >
                        <Caption weight='2' level='2'>No enviado · Reintentar</Caption>
                    </button>
                ) : (
                    <Caption weight='3' level='2' style={{ alignSelf: 'flex-end' }}>
                        {status === 'sending' ? 'Enviando…' : time}
                    </Caption>
                )}
            </div>
        </div>
    );
}
