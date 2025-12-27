import { RequestChatMessage } from "./request-chat-message.model";
import { User } from "./user.model";

export type RequestChatVoteType = 'approve' | 'reject';

export interface RequestChatItem {
    uuid: string;
    unreadMessagesCount: number;
    lastMessage: {
        at: string;
        content: string;
        from: User;
    };
    requester: User;
    createdAt: Date;
    state: string;

}

export interface RequestChatList {
    items: RequestChatItem[];
}

export interface CreateRequestChatPayload {
    requesterUUID: string;
    whereYouFoundUs?: string;
    interests?: string;
}

export interface RequestChat {
    uuid: string;
    requester: User;
    messages: RequestChatMessage[];
    whereYouFoundUs?: string;
    interests?: string;
    createdAt: Date;
    state: string;
    votes: {
        approved: number;
        rejected: number;
    };
    userVote?: RequestChatVoteType;
}