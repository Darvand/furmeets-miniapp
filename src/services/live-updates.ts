import { RequestChatState } from "@/models/me.model";
import { RequestChatMessage } from "@/models/request-chat-message.model";
import { RequestChat, RequestChatItem, RequestChatVotesEvent } from "@/models/request-chat.model";
import { setOwnRequestChat } from "@/state/me.slice";
import { outboxActions } from "@/state/outbox.slice";
import type { AppDispatch, RootState } from "@/state/store";
import { REQUEST_CHAT_TAG, requestChatApi } from "./request-chat.service";
import { getSocket } from "./socket";

/** Cuánto se espera el ack antes de marcar un mensaje como "no enviado". */
const ACK_TIMEOUT_MS = 10_000;

/** Intento en curso de cada mensaje: un timeout de un intento viejo no marca al reintento. */
const attempts = new Map<string, number>();

interface SocketException {
    message?: string;
    /** La API incluye el evento y el payload que fallaron (ver `createWsValidationPipe`). */
    cause?: { pattern?: string; data?: { clientMessageId?: unknown } };
}

const patchChat = (id: string, recipe: (chat: RequestChat) => void) =>
    requestChatApi.util.updateQueryData('getRequestChatById', id, recipe);

const patchListItem = (id: string, recipe: (item: RequestChatItem) => void) =>
    requestChatApi.util.updateQueryData('getAllRequestChats', undefined, (list) => {
        const item = list.items.find((i) => i.uuid === id);
        if (item) {
            recipe(item);
        }
    });

/**
 * Un mensaje confirmado por la API (ack o evento): pasa de la bandeja de salida a la caché
 * del chat y actualiza el último mensaje del listado. Llega dos veces al autor (ack y
 * evento), así que no se agrega si ya está.
 */
function receiveMessage(dispatch: AppDispatch, message: RequestChatMessage): void {
    if (message.clientMessageId) {
        attempts.delete(message.clientMessageId);
        dispatch(outboxActions.confirmed(message.clientMessageId));
    }
    dispatch(patchChat(message.requestChatUUID, (chat) => {
        if (!chat.messages.some((m) => m.uuid === message.uuid)) {
            chat.messages.push(message);
        }
    }));
    dispatch(patchListItem(message.requestChatUUID, (item) => {
        item.lastMessage = { at: message.sentAt, content: message.content, from: message.user };
    }));
}

/** Resumen de una solicitud recién creada, tal como lo daría el listado. */
function toListItem(chat: RequestChat): RequestChatItem {
    const last = chat.messages[chat.messages.length - 1] as RequestChatMessage | undefined;
    return {
        uuid: chat.uuid,
        requester: chat.requester,
        lastMessage: last && { at: last.sentAt, content: last.content, from: last.user },
        createdAt: last?.sentAt ?? new Date().toISOString(),
        state: chat.state,
        votes: chat.votes,
    };
}

/**
 * Escucha el socket compartido y parchea la caché de RTK Query con cada evento, filtrando
 * por solicitud: nada se recarga. Devuelve la función que deja de escuchar.
 */
export function startLiveUpdates(dispatch: AppDispatch): () => void {
    const socket = getSocket();
    let connectedBefore = false;

    const handlers = {
        // Tras una reconexión pudo perderse algún evento: se pide de nuevo lo que esté en uso.
        connect: () => {
            if (connectedBefore) {
                dispatch(requestChatApi.util.invalidateTags([REQUEST_CHAT_TAG]));
            }
            connectedBefore = true;
        },
        'request-chat': (message: RequestChatMessage) => receiveMessage(dispatch, message),
        'request-chat-votes': ({ uuid, state, votes }: RequestChatVotesEvent) => {
            // Conteos de todos; el voto propio no cambia.
            dispatch(patchChat(uuid, (chat) => Object.assign(chat, { state, votes })));
            dispatch(patchListItem(uuid, (item) => Object.assign(item, { state, votes })));
        },
        'request-chat-update': (update: RequestChat) => {
            const { uuid, state, votes, messages, hasOlderMessages } = update;
            dispatch(patchChat(uuid, (chat) => {
                Object.assign(chat, { state, votes });
                // Trae solo la última página: si se solapa con lo que hay, se agregan los
                // nuevos y se conservan las páginas anteriores ya cargadas.
                const known = new Set(chat.messages.map((m) => m.uuid));
                if (messages.some((m) => known.has(m.uuid))) {
                    chat.messages.push(...messages.filter((m) => !known.has(m.uuid)));
                } else {
                    Object.assign(chat, { messages, hasOlderMessages });
                }
            }));
            const last = messages[messages.length - 1] as RequestChatMessage | undefined;
            dispatch(patchListItem(uuid, (item) => {
                Object.assign(item, { state, votes });
                if (last) {
                    item.lastMessage = { at: last.sentAt, content: last.content, from: last.user };
                }
            }));
            // Si es la propia solicitud, el estado nuevo también decide el enrutamiento.
            dispatch(setOwnRequestChat({ id: uuid, state: state as RequestChatState }));
        },
        'new-request-chat': (chat: RequestChat) => {
            dispatch(requestChatApi.util.updateQueryData('getAllRequestChats', undefined, (list) => {
                if (!list.items.some((i) => i.uuid === chat.uuid)) {
                    list.items.unshift(toListItem(chat));
                }
            }));
        },
        exception: (error: SocketException) => {
            const id = error.cause?.pattern === 'request-chat' ? error.cause.data?.clientMessageId : undefined;
            if (typeof id === 'string') {
                dispatch(outboxActions.failed(id));
            }
        },
    };

    for (const [event, handler] of Object.entries(handlers)) {
        socket.on(event, handler);
    }
    if (socket.connected) {
        connectedBefore = true;
    }
    return () => {
        for (const [event, handler] of Object.entries(handlers)) {
            socket.off(event, handler);
        }
    };
}

/**
 * Envío optimista: el mensaje aparece al instante como "enviando" y se confirma con el
 * ack. Si la API lo rechaza o no responde a tiempo, queda "no enviado" y se puede reintentar
 * con el mismo `clientMessageId`.
 */
export function sendMessage(requestChatUUID: string, content: string, clientMessageId: string = crypto.randomUUID()) {
    return (dispatch: AppDispatch) => {
        const attempt = (attempts.get(clientMessageId) ?? 0) + 1;
        attempts.set(clientMessageId, attempt);
        dispatch(outboxActions.sending({
            clientMessageId,
            requestChatUUID,
            content,
            sentAt: new Date().toISOString(),
        }));
        getSocket()
            .timeout(ACK_TIMEOUT_MS)
            .emit(
                'request-chat',
                { requestChatUUID, clientMessageId, content },
                (error: Error | null, message?: RequestChatMessage) => {
                    if (error || !message) {
                        if (attempts.get(clientMessageId) === attempt) {
                            dispatch(outboxActions.failed(clientMessageId));
                        }
                        return;
                    }
                    receiveMessage(dispatch, message);
                },
            );
    };
}

/** Reintenta un mensaje "no enviado". Mientras la API no guarde el `clientMessageId` (T16),
 * si el primer intento sí llegó a guardarse, el reintento lo duplica. */
export function retryMessage(clientMessageId: string) {
    return (dispatch: AppDispatch, getState: () => RootState) => {
        const message = getState().outbox.find((m) => m.clientMessageId === clientMessageId);
        if (message) {
            dispatch(sendMessage(message.requestChatUUID, message.content, clientMessageId));
        }
    };
}
