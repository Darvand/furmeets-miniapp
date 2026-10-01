import { Me } from "@/models/me.model";
import { setMe } from "@/state/me.slice";
import { setUser } from "@/state/user.slice";
import { createApi } from "@reduxjs/toolkit/query/react";
import { authBaseQuery } from "./api";

export const meApi = createApi({
    reducerPath: 'meApi',
    baseQuery: authBaseQuery('/me'),
    endpoints: (builder) => ({
        /** Única petición de arranque: usuario, rol y solicitud propia. */
        getMe: builder.query<Me, void>({
            query: () => '',
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setUser(data.user));
                    dispatch(setMe({
                        role: data.role,
                        requestChatId: data.requestChatId,
                        requestChatState: data.requestChatState,
                    }));
                } catch (error) {
                    console.error('Error fetching me:', error);
                }
            },
        }),
    }),
});

export const { useGetMeQuery } = meApi;
