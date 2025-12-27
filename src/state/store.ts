import { requestChatApi } from "@/services/request-chat.service";
import { configureStore } from "@reduxjs/toolkit";
import { requestChatReducer } from "./request-chat.slice";
import { userReducer } from "./user.slice";
import { userApi } from "@/services/user.service";
import { hubReducer } from "./hub.slice";
import { groupApi } from "@/services/group.service";


export const store = configureStore({
    reducer: {
        [requestChatApi.reducerPath]: requestChatApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [groupApi.reducerPath]: groupApi.reducer,
        requestChat: requestChatReducer,
        user: userReducer,
        hub: hubReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(requestChatApi.middleware)
            .concat(userApi.middleware)
            .concat(groupApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;