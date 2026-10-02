import { CreateRequestChatPayload, RequestChat, RequestChatItem, RequestChatVoteType } from "@/models/request-chat.model";
import { setRequestChats } from "@/state/hub.slice";
import { setRequestChat } from "@/state/request-chat.slice";
import { setOwnRequestChat } from "@/state/me.slice";
import { createApi } from "@reduxjs/toolkit/query/react";
import { authBaseQuery } from "./api";

interface ListRequestChatResponse {
    items: RequestChatItem[];
}

export const requestChatApi = createApi({
    reducerPath: 'requestChatApi',
    baseQuery: authBaseQuery('/request-chats'),
    endpoints: (builder) => ({
        getRequestChatById: builder.query<RequestChat, string>({
            query: (id: string) => `/${id}`,
            async onQueryStarted(_id, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setRequestChat(data));
                } catch (error) {
                    console.error('Error fetching request chat by ID:', error);
                }
            },
        }),

        getAllRequestChats: builder.query<ListRequestChatResponse, void>({
            query: () => `/`,
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setRequestChats(data.items));
                } catch (error) {
                    console.error('Error fetching all request chats:', error);
                }
            },
        }),

        createRequestChat: builder.mutation<RequestChat, CreateRequestChatPayload>({
            query: (payload) => ({
                url: `/`,
                method: 'POST',
                body: payload,
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setRequestChat(data));
                    dispatch(setOwnRequestChat({ id: data.uuid, state: 'InProgress' }));
                } catch (error) {
                    console.error('Error creating request chat:', error);
                }
            },
        }),

        vote: builder.mutation<RequestChat, { id: string; type: RequestChatVoteType }>({
            query: ({ id, type }) => ({
                url: `/${id}/vote/${type}`,
                method: 'PUT',
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setRequestChat(data));
                } catch (error) {
                    console.error('Error voting on request chat:', error);
                }
            },
        }),
    })
})

export const {
    useGetRequestChatByIdQuery,
    useGetAllRequestChatsQuery,
    useCreateRequestChatMutation,
    useVoteMutation,
} = requestChatApi;