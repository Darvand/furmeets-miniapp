import { Group } from "@/models/group.model";
import { setGroup } from "@/state/hub.slice";
import { createApi } from "@reduxjs/toolkit/query/react";
import { authBaseQuery } from "./api";

export const groupApi = createApi({
    reducerPath: 'groupApi',
    baseQuery: authBaseQuery('/groups'),
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
    })
})

export const {
    useGetGroupQuery,
} = groupApi;
