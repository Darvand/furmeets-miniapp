import { RequestChat } from "@/models/request-chat.model";
import { setRequestChats } from "@/state/hub.slice";
import { setRequestChat } from "@/state/request-chat.slice";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ListRequestChatResponse {
    items: RequestChat[];
}

export const requestChatApi = createApi({
    reducerPath: 'requestChatApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL}/request-chats`,
    }),
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
    })
})

export const {
    useGetRequestChatByIdQuery,
    useGetAllRequestChatsQuery,
} = requestChatApi;