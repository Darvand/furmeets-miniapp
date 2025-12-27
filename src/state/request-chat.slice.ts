import { RequestChatMessage } from "@/models/request-chat-message.model";
import { RequestChat } from "@/models/request-chat.model";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type NullableRequestChat = RequestChat | null;

const BOT_FILE_URL = `https://api.telegram.org/file/bot${import.meta.env.VITE_TELEGRAM_BOT_TOKEN}`;

export const requestChatSlice = createSlice({
    name: 'requestChat',
    initialState: null as NullableRequestChat,
    reducers: {
        setRequestChat: (_state: RequestChat | null, action: PayloadAction<RequestChat>) => {
            return {
                ...action.payload,
                requester: {
                    ...action.payload.requester,
                    avatarUrl: `${BOT_FILE_URL}/${action.payload.requester.avatarUrl}`
                },
                messages: action.payload.messages.map(msg => ({
                    ...msg,
                    user: {
                        ...msg.user,
                        avatarUrl: `${BOT_FILE_URL}/${msg.user.avatarUrl}`
                    }
                })),
            };
        },
        addMessage: (state: RequestChat | null, action: PayloadAction<RequestChatMessage>) => {
            if (state) {
                state.messages.push({
                    ...action.payload,
                    user: {
                        ...action.payload.user,
                        avatarUrl: `${BOT_FILE_URL}/${action.payload.user.avatarUrl}`
                    }
                });
            }
        }
    }
})

export const { setRequestChat, addMessage } = requestChatSlice.actions;
export const requestChatReducer = requestChatSlice.reducer;