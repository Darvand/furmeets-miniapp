import { RequestChatMessage } from "@/models/request-chat-message.model";
import { RequestChat } from "@/models/request-chat.model";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type NullableRequestChat = RequestChat | null;

// Los avatares y la foto del grupo llegan como rutas de archivo de Telegram, que solo se
// descargan con el token del bot. El token no puede ir en el bundle: hasta que la API las
// sirva por /media/:id (T08/T09) se muestran las iniciales.

export const requestChatSlice = createSlice({
    name: 'requestChat',
    initialState: null as NullableRequestChat,
    reducers: {
        setRequestChat: (_state: RequestChat | null, action: PayloadAction<RequestChat>) => {
            return {
                ...action.payload,
                requester: {
                    ...action.payload.requester,
                    avatarUrl: undefined
                },
                messages: action.payload.messages.map(msg => ({
                    ...msg,
                    user: {
                        ...msg.user,
                        avatarUrl: undefined
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
                        avatarUrl: undefined
                    }
                });
            }
        }
    }
})

export const { setRequestChat, addMessage } = requestChatSlice.actions;
export const requestChatReducer = requestChatSlice.reducer;