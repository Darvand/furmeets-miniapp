import { Group } from "@/models/group.model";
import { setGroup } from "@/state/hub.slice";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

export const groupApi = createApi({
    reducerPath: 'groupApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL}/groups`,
        prepareHeaders: (headers) => {
            const lp = retrieveLaunchParams();
            const telegramId = lp.tgWebAppData?.user?.id;
            if (telegramId) {
                headers.set('x-telegram-id', telegramId.toString());
            }

            return headers;
        },
    }),
    endpoints: (builder) => ({
        getGroup: builder.query<Group, void>({
            query: () => `/`,
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setGroup(data));
                } catch (error) {
                    console.error('Error fetching group:', error);
                }
            },
        }),
        sync: builder.mutation<void, void>({
            query: () => ({
                url: `/sync`,
                method: 'POST',
            }),
        }),
    })
})

export const {
    useGetGroupQuery,
    useSyncMutation,
    useLazyGetGroupQuery,
} = groupApi;