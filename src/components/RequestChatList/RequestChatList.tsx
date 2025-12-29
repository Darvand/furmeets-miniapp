import { wrapLastText } from "@/helpers/text";
import { RequestChatItem } from "@/models/request-chat.model";
import { themeParams } from "@telegram-apps/sdk-react";
import { Accordion, Avatar, Badge, Caption, Cell, List } from "@telegram-apps/telegram-ui";
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
                            key={chat.uuid}
                            style={{
                                padding: '0 8px',
                                margin: '-12px 0',
                                gap: '12px'
                            }}
                            before={<Avatar
                                size={40}
                                src={chat.requester.avatarUrl}
                            />}
                            subtitle={
                                <div>
                                    <Caption style={{ color: themeParams.accentTextColor() }}>{chat.lastMessage.from.name}: </Caption>
                                    <Caption>{wrapLastText(30, chat.lastMessage.from.name, chat.lastMessage.content)}</Caption>
                                </div>
                            }
                            after={
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <Caption>{chat.lastMessage.at}</Caption>
                                    <Badge mode="gray" type="number">{chat.unreadMessagesCount}</Badge>
                                </div>
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