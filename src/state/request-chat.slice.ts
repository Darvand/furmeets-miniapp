import { RequestChatMessage } from "@/models/request-chat-message.model";
import { RequestChat, RequestChatVoteResult } from "@/models/request-chat.model";
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
        },
        /** Aplica un voto a la solicitud abierta, si es la misma. */
        applyVoteResult: (state: RequestChat | null, action: PayloadAction<RequestChatVoteResult>) => {
            if (state && state.uuid === action.payload.uuid) {
                state.state = action.payload.state;
                state.votes = action.payload.votes;
                state.userVote = action.payload.userVote;
            }
        }
    }
})

export const { setRequestChat, addMessage, applyVoteResult } = requestChatSlice.actions;
export const requestChatReducer = requestChatSlice.reducer;