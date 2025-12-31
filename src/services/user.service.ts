import { User } from "@/models/user.model";
import { setUser } from "@/state/user.slice";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { retrieveLaunchParams, type User as TelegramUser } from '@telegram-apps/sdk-react';
import { groupApi } from "./group.service";

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL}/users`,
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
        getUserByTelegramUser: builder.query<User, TelegramUser>({
            query: (telegramUser: TelegramUser) => `/${telegramUser.id}`,
            async onQueryStarted(telegramUser, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setUser(data));
                } catch (error: any) {
                    if (error?.error.status === 404) {
                        const newUser: Partial<User> = {
                            telegramId: telegramUser.id,
                            username: telegramUser?.username,
                            name: `${telegramUser?.first_name || ''} ${telegramUser?.last_name || ''}`.trim(),
                            avatarUrl: telegramUser?.photo_url,
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
                    dispatch(groupApi.endpoints.getGroup.initiate());
                } catch (error) {
                    console.error('Error creating user:', error);
                }
            },
        }),
    })
});

export const {
    useLazyGetUserByTelegramUserQuery,
    useGetUserByTelegramUserQuery,
    useCreateUserMutation,
} = userApi;