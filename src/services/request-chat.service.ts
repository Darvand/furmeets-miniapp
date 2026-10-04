import { ApplicationPayload } from "@/models/application.model";
import { RequestChat, RequestChatItem, RequestChatMessagePage, RequestChatVoteResult, RequestChatVoteType } from "@/models/request-chat.model";
import { setOwnRequestChat } from "@/state/me.slice";
import { toggleOwnVote } from "@/helpers/votes";
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiUrl, authBaseQuery } from "./api";

export interface ListRequestChatResponse {
    items: RequestChatItem[];
}

/** Un solo tag: al reconectar el socket se invalida todo para recuperar lo perdido. */
export const REQUEST_CHAT_TAG = 'RequestChat';

/**
 * La caché solo guarda lo que confirmó la API. Los eventos del socket la parchean en vivo
 * (`live-updates.ts`), así recibir un mensaje o un voto no genera ninguna petición.
 */
export const requestChatApi = createApi({
    reducerPath: 'requestChatApi',
    baseQuery: authBaseQuery('/request-chats'),
    tagTypes: [REQUEST_CHAT_TAG],
    endpoints: (builder) => ({
        getRequestChatById: builder.query<RequestChat, string>({
            query: (id: string) => `/${id}`,
            providesTags: (_result, _error, id) => [{ type: REQUEST_CHAT_TAG, id }],
        }),

        /**
         * Página de mensajes anteriores a `before` (el primero que se tiene), agregada al
         * principio del chat en caché. Es una mutación porque no tiene caché propia.
         */
        loadOlderMessages: builder.mutation<RequestChatMessagePage, { id: string; before: string }>({
            query: ({ id, before }) => ({
                url: `/${id}/messages`,
                params: { before },
            }),
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(requestChatApi.util.updateQueryData('getRequestChatById', id, (chat) => {
                        const known = new Set(chat.messages.map((m) => m.uuid));
                        chat.messages.unshift(...data.items.filter((m) => !known.has(m.uuid)));
                        chat.hasOlderMessages = data.hasMore;
                    }));
                } catch (error) {
                    console.error('Error loading older messages:', error);
                }
            },
        }),

        getAllRequestChats: builder.query<ListRequestChatResponse, void>({
            query: () => `/`,
            providesTags: [REQUEST_CHAT_TAG],
            // Se mantiene aunque se abra un chat: los eventos la siguen parchando y volver
            // al inicio no la pide de nuevo.
            keepUnusedDataFor: 60 * 60,
        }),

        /** Envía el formulario (`POST /applications`) y abre el chat de la solicitud. */
        submitApplication: builder.mutation<RequestChat, ApplicationPayload>({
            query: (payload) => ({
                // Fuera de `/request-chats`: una URL absoluta no se une a la base.
                url: apiUrl('/applications'),
                method: 'POST',
                body: payload,
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // El chat ya viene en la respuesta: abrirlo no lo pide otra vez.
                    void dispatch(requestChatApi.util.upsertQueryData('getRequestChatById', data.uuid, data));
                    dispatch(setOwnRequestChat({ id: data.uuid, state: 'InProgress' }));
                } catch (error) {
                    console.error('Error submitting application:', error);
                }
            },
        }),

        /**
         * Voto optimista: el chat y el listado lo reflejan al instante. La respuesta trae los
         * conteos reales (incluye los votos de otros); si la API lo rechaza, se revierte.
         */
        vote: builder.mutation<RequestChatVoteResult, { id: string; type: RequestChatVoteType }>({
            query: ({ id, type }) => ({
                url: `/${id}/vote/${type}`,
                method: 'PUT',
            }),
            async onQueryStarted({ id, type }, { dispatch, queryFulfilled }) {
                const patches = [
                    dispatch(requestChatApi.util.updateQueryData('getRequestChatById', id, (chat) => {
                        Object.assign(chat, toggleOwnVote(chat, type));
                    })),
                    dispatch(requestChatApi.util.updateQueryData('getAllRequestChats', undefined, (list) => {
                        const item = list.items.find((i) => i.uuid === id);
                        if (item) {
                            Object.assign(item, toggleOwnVote(item, type));
                        }
                    })),
                ];
                try {
                    const { data } = await queryFulfilled;
                    const confirmed = { state: data.state, votes: data.votes, userVote: data.userVote };
                    dispatch(requestChatApi.util.updateQueryData('getRequestChatById', id, (chat) => {
                        Object.assign(chat, confirmed);
                    }));
                    dispatch(requestChatApi.util.updateQueryData('getAllRequestChats', undefined, (list) => {
                        const item = list.items.find((i) => i.uuid === id);
                        if (item) {
                            Object.assign(item, confirmed);
                        }
                    }));
                } catch (error) {
                    patches.forEach((patch) => patch.undo());
                    console.error('Error voting on request chat:', error);
                }
            },
        }),
    })
})

export const {
    useGetRequestChatByIdQuery,
    useGetAllRequestChatsQuery,
    useLoadOlderMessagesMutation,
    useSubmitApplicationMutation,
    useVoteMutation,
} = requestChatApi;
