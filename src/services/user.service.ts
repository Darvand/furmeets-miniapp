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
        getUserById: builder.query<User, number>({
            query: (telegramId: number) => `/${telegramId}`,
            async onQueryStarted(_id, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setUser(data));
                } catch (error) {
                    console.error('Error fetching user by ID:', error);
                }
            },
        }),
        createUser: builder.mutation<User, Partial<User>>({
            query: (newUser) => ({
                url: `/`,
                method: 'POST',
                body: newUser,
            }),
            async onQueryStarted(_newUser, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setUser(data));
                } catch (error) {
                    console.error('Error creating user:', error);
                }
            },
        }),
    })
});

export const {
    useGetUserByIdQuery,
    useCreateUserMutation,
} = userApi;