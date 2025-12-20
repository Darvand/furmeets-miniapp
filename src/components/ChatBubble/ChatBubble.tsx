import { themeParams } from "@telegram-apps/sdk-react";
import { Avatar, Caption, Text } from "@telegram-apps/telegram-ui";
import { FC } from "react";

interface ChatBubbleProps {
    message: string;
    username: string;
    time: string;
    avatarUrl?: string;
    isOwn?: boolean;
}

export const ChatBubble: FC<ChatBubbleProps> = ({ message, username, time, avatarUrl }) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                marginBottom: '12px',
            }}
        >
            <Avatar
                size={40}
                src={avatarUrl || "https://avatars.githubusercontent.com/u/84640980?v=4"}
            />
            <div
                style={{
                    backgroundColor: themeParams.secondaryBackgroundColor(),
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
                <Text>{message}</Text>
                <Caption weight='3' level='2' style={{ alignSelf: 'flex-end' }}>{time}</Caption>
            </div>
        </div>
    );
}