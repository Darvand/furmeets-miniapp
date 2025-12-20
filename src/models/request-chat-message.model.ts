import { User } from "./user.model";

export interface RequestChatMessage {
    uuid: string;
    user: User;
    content: string;
    createdAt: Date;
}