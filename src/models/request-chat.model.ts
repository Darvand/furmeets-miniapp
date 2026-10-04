import { ApplicationForm, LegacyApplication } from "./application.model";
import { RequestChatMessage } from "./request-chat-message.model";
import { User } from "./user.model";

export type RequestChatVoteType = 'approve' | 'reject';

export interface RequestChatItem {
    uuid: string;
    /** Falta si la solicitud no tiene mensajes. */
    lastMessage?: {
        /** ISO-8601 UTC (ver `formatChatTime`). */
        at: string;
        content: string;
        from: User;
    };
    requester: User;
    /** ISO-8601 UTC. */
    createdAt: string;
    state: string;
    votes: RequestChatVotes;
    userVote?: RequestChatVoteType;
}

export interface RequestChatVotes {
    approved: number;
    rejected: number;
}

/** Evento `request-chat-votes` (solo miembros): estado y conteos, sin el voto de nadie. */
export interface RequestChatVotesEvent {
    uuid: string;
    state: string;
    votes: RequestChatVotes;
}

export interface RequestChatList {
    items: RequestChatItem[];
}

export interface RequestChat {
    uuid: string;
    requester: User;
    /** Los últimos mensajes (hasta 50) más las páginas anteriores que se hayan pedido. */
    messages: RequestChatMessage[];
    /** Hay mensajes anteriores al primero de `messages` (ver `loadOlderMessages`). */
    hasOlderMessages: boolean;
    /** Falta en las solicitudes anteriores al formulario actual: esas traen `legacy`. */
    form?: ApplicationForm;
    legacy?: LegacyApplication;
    state: string;
    votes: RequestChatVotes;
    userVote?: RequestChatVoteType;
}

/** `GET /request-chats/:id/messages?before=`: mensajes anteriores, en orden. */
export interface RequestChatMessagePage {
    items: RequestChatMessage[];
    /** Quedan más anteriores al primero de `items`. */
    hasMore: boolean;
}

/**
 * Respuesta de un voto: solo estado y conteos. Si el voto cerró la solicitud, la
 * solicitud con el mensaje de cierre llega después por `request-chat-update`.
 */
export interface RequestChatVoteResult {
    uuid: string;
    state: string;
    votes: RequestChatVotes;
    userVote?: RequestChatVoteType;
}