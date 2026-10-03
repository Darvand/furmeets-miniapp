import { User } from "./user.model";

export interface RequestChatMessage {
    uuid: string;
    requestChatUUID: string;
    /** Solo en el ack y el evento de un mensaje recién enviado (ver `OutboxMessage`). */
    clientMessageId?: string;
    user: User;
    content: string;
    /** ISO-8601 UTC (ver `formatChatTime`). */
    sentAt: string;
}