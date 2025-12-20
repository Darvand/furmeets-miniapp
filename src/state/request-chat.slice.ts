import { RequestChatMessage } from "@/models/request-chat-message.model";
import { RequestChat } from "@/models/request-chat.model";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type NullableRequestChat = RequestChat | null;

export const requestChatSlice = createSlice({
    name: 'requestChat',
    initialState: null as NullableRequestChat,
    reducers: {
        setRequestChat: (_state: RequestChat | null, action: PayloadAction<RequestChat>) => {
            return action.payload;
        },
        addMessage: (state: RequestChat | null, action: PayloadAction<RequestChatMessage>) => {
            if (state) {
                state.messages.push(action.payload);
            }
        }
    }
})

export const { setRequestChat, addMessage } = requestChatSlice.actions;
export const requestChatReducer = requestChatSlice.reducer;