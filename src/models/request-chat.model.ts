import { RequestChatMessage } from "./request-chat-message.model";
import { User } from "./user.model";

export interface RequestChat {
    uuid: string;
    requester: User;
    createdAt: Date;
    messages: RequestChatMessage[];
}