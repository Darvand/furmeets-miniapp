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
}

export const ChatBubble: FC<ChatBubbleProps> = ({ message, username, time, avatarMediaId, isOwn }) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                marginBottom: '12px',
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
                <Caption weight='3' level='2' style={{ alignSelf: 'flex-end' }}>{time}</Caption>
            </div>
        </div>
    );
}