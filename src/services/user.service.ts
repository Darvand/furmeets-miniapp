import { User } from "@/models/user.model";
import { setUser } from "@/state/user.slice";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { type User as TelegramUser } from '@telegram-apps/sdk-react';

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL}/users`,
        headers: {
            "ngrok-skip-browser-warning": "true",
        }
    }),
    endpoints: (builder) => ({
        getUserByTelegramUser: builder.query<User, TelegramUser>({
            query: (telegramUser: TelegramUser) => `/${telegramUser.id}`,
            async onQueryStarted(telegramUser, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setUser(data));
                } catch (error: any) {
                    console.log('Error object in onQueryStarted:', error);
                    if (error?.error.status === 404) {
                        // not found, create it with createUser mutatin
                        const newUser: Partial<User> = {
                            telegramId: telegramUser.id,
                            username: telegramUser?.username || 'Unknown',
                            name: `${telegramUser?.first_name || ''} ${telegramUser?.last_name || ''}`.trim(),
                            avatarUrl: telegramUser?.photo_url || '',
                        };
                        dispatch(userApi.endpoints.createUser.initiate(newUser));
                        console.log('User not found, creating new user:', newUser);
                        return;
                    }
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
    useLazyGetUserByTelegramUserQuery,
    useCreateUserMutation,
} = userApi;