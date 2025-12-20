import { User } from "@/models/user.model";
import { setUser } from "@/state/user.slice";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL}/users`,
    }),
    endpoints: (builder) => ({
        getUserById: builder.query<User, string>({
            query: (id: string) => `/${id}`,
            async onQueryStarted(_id, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setUser(data));
                } catch (error) {
                    console.error('Error fetching user by ID:', error);
                }
            },
        })
    })
});

export const {
    useGetUserByIdQuery,
} = userApi;