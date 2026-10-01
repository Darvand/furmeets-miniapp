import { requestChatApi } from "@/services/request-chat.service";
import { configureStore } from "@reduxjs/toolkit";
import { requestChatReducer } from "./request-chat.slice";
import { userReducer } from "./user.slice";
import { meApi } from "@/services/me.service";
import { meReducer } from "./me.slice";
import { hubReducer } from "./hub.slice";
import { groupApi } from "@/services/group.service";


export const store = configureStore({
    reducer: {
        [requestChatApi.reducerPath]: requestChatApi.reducer,
        [meApi.reducerPath]: meApi.reducer,
        [groupApi.reducerPath]: groupApi.reducer,
        requestChat: requestChatReducer,
        user: userReducer,
        me: meReducer,
        hub: hubReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(requestChatApi.middleware)
            .concat(meApi.middleware)
            .concat(groupApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;