import { initials, wrapLastText } from "@/helpers/text";
import { formatChatTime } from "@/helpers/date";
import { RequestChatItem } from "@/models/request-chat.model";
import { themeParams } from "@telegram-apps/sdk-react";
import { Accordion, Caption, Cell, List } from "@telegram-apps/telegram-ui";
import { MediaAvatar } from "@/components/MediaAvatar";
import { AccordionContent } from "@telegram-apps/telegram-ui/dist/components/Blocks/Accordion/components/AccordionContent/AccordionContent";
import { AccordionSummary } from "@telegram-apps/telegram-ui/dist/components/Blocks/Accordion/components/AccordionSummary/AccordionSummary";
import { useState } from "react";
import { Icon20Select, Icon24Chat } from "tmaui/icons";

interface RequestChatListProps {
    requestChats: RequestChatItem[];
    onSelect: (chat: RequestChatItem) => void;
    type: 'InProgress' | 'Completed';
}

export const RequestChatList: React.FC<RequestChatListProps> = ({ requestChats, onSelect, type }) => {

    const [requestChatExpanded, setRequestChatExpanded] = useState<boolean>(false);
    return (
        <Accordion expanded={requestChatExpanded} onChange={() => setRequestChatExpanded(!requestChatExpanded)}>
            <AccordionSummary
                before={type === 'InProgress' ? <Icon24Chat /> : <Icon20Select />}
                after={<Caption weight="2" style={{ color: themeParams.accentTextColor() }}>{requestChats.length}</Caption>}
            >
                <Caption weight="3">{type === 'InProgress' ? 'Solicitudes en progreso' : 'Solicitudes completadas'}</Caption>
            </AccordionSummary>
            <AccordionContent>
                <List style={{
                    padding: '8px 0px'
                }}>
                    {requestChats.map((chat) => (
                        <Cell
                            Component='div'
                            key={chat.uuid}
                            style={{
                                padding: '0 8px',
                                margin: '-12px 0',
                                gap: '12px'
                            }}
                            before={<MediaAvatar
                                size={40}
                                mediaId={chat.requester.avatarMediaId}
                                acronym={initials(chat.requester.name)}
                            />}
                            subtitle={chat.lastMessage && (
                                <div>
                                    <Caption style={{ color: themeParams.accentTextColor() }}>{chat.lastMessage.from.name}: </Caption>
                                    <Caption>{wrapLastText(30, chat.lastMessage.from.name, chat.lastMessage.content)}</Caption>
                                </div>
                            )}
                            after={
                                chat.lastMessage && <Caption>{formatChatTime(chat.lastMessage.at)}</Caption>
                            }
                            onClick={() => onSelect(chat)}
                        >
                            {chat.requester.name}
                        </Cell>
                    ))}
                </List>
            </AccordionContent>
        </Accordion>
    )
};