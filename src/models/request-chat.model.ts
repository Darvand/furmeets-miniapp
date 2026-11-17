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

/** Parte del listado: las que siguen en curso, o el historial de las ya cerradas. */
export type RequestChatScope = 'open' | 'closed';

export interface RequestChatThresholds {
    approve: number;
    reject: number;
}

/** Cuántas solicitudes hay por estado, en toda la BD. */
export interface RequestChatTotals {
    total: number;
    inProgress: number;
    approved: number;
    rejected: number;
}

/** `GET /request-chats`: una página, con los totales y los umbrales vigentes. */
export interface RequestChatList {
    items: RequestChatItem[];
    /** Para pedir la página siguiente; falta en la última. */
    nextCursor?: string;
    totals: RequestChatTotals;
    thresholds: RequestChatThresholds;
}

/** Un aval: quién y cuándo. A diferencia de los votos, lleva el nombre de su autor. */
export interface RequestChatEndorsement {
    endorser: Pick<User, 'uuid' | 'name' | 'username' | 'avatarMediaId'>;
    /** ISO-8601 UTC. */
    at: string;
}

/** Evento `request-chat-endorsements` y respuesta de avalar o retirar el aval. */
export interface RequestChatEndorsements {
    uuid: string;
    endorsements: RequestChatEndorsement[];
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
    // Lo siguiente es de la revisión: la API solo se lo envía a los miembros (RNF-PRI-03).
    votes?: RequestChatVotes;
    thresholds?: RequestChatThresholds;
    userVote?: RequestChatVoteType;
    endorsements?: RequestChatEndorsement[];
    /** ISO-8601 UTC. */
    createdAt?: string;
}

/** `GET /request-chats/:id/messages?before=`: mensajes anteriores, en orden. */
export interface RequestChatMessagePage {
    items: RequestChatMessage[];
    /** Quedan más anteriores al primero de `items`. */
    hasMore: boolean;
}

/**
 * Respuesta de un voto: solo estado y conteos. Si el voto cerró la solicitud, su nuevo
 * estado llega después a todos por `request-chat-update` (sin mensaje de cierre en el chat).
 */
export interface RequestChatVoteResult {
    uuid: string;
    state: string;
    votes: RequestChatVotes;
    userVote?: RequestChatVoteType;
}