import { requestChatApi } from "@/services/request-chat.service";
import { configureStore } from "@reduxjs/toolkit";
import { requestChatReducer } from "./request-chat.slice";
import { userReducer } from "./user.slice";
import { userApi } from "@/services/user.service";


export const store = configureStore({
    reducer: {
        [requestChatApi.reducerPath]: requestChatApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        requestChat: requestChatReducer,
        user: userReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(requestChatApi.middleware).concat(userApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;