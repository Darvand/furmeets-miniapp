import { RequestChat } from "@/models/request-chat.model";
import { setRequestChat } from "@/state/request-chat.slice";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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
    })
})

export const {
    useGetRequestChatByIdQuery,
} = requestChatApi;