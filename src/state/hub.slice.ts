import { Group } from "@/models/group.model";
import { RequestChatItem } from "@/models/request-chat.model"
import { createSlice, PayloadAction } from "@reduxjs/toolkit/react";

// Los avatares y la foto del grupo llegan como rutas de archivo de Telegram, que solo se
// descargan con el token del bot. El token no puede ir en el bundle: hasta que la API las
// sirva por /media/:id (T08/T09) se muestran las iniciales.

interface HubState {
    requestChats: RequestChatItem[];
    group: Group | null;
}

const initialState: HubState = {
    requestChats: [],
    group: null,
};

export const hubSlice = createSlice({
    name: 'hub',
    initialState,
    reducers: {
        setRequestChats: (state: HubState, action: PayloadAction<RequestChatItem[]>) => {
            state.requestChats = action.payload.map(item => ({
                ...item,
                requester: {
                    ...item.requester,
                    avatarUrl: undefined
                },
                lastMessage: {
                    ...item.lastMessage,
                    from: {
                        ...item.lastMessage.from,
                        avatarUrl: undefined
                    }
                }
            }))
        },
        setGroup: (state: HubState, action: PayloadAction<Group>) => {
            state.group = {
                ...action.payload,
                photoUrl: ''
            };
        },
    }
})

export const { setRequestChats, setGroup } = hubSlice.actions;
export const hubReducer = hubSlice.reducer;