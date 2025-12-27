import { Group } from "@/models/group.model";
import { RequestChatItem } from "@/models/request-chat.model"
import { createSlice, PayloadAction } from "@reduxjs/toolkit/react";

const BOT_FILE_URL = `https://api.telegram.org/file/bot${import.meta.env.VITE_TELEGRAM_BOT_TOKEN}`;

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
                    avatarUrl: `${BOT_FILE_URL}/${item.requester.avatarUrl}`
                },
                lastMessage: {
                    ...item.lastMessage,
                    from: {
                        ...item.lastMessage.from,
                        avatarUrl: `${BOT_FILE_URL}/${item.lastMessage.from.avatarUrl}`
                    }
                }
            }))
        },
        setGroup: (state: HubState, action: PayloadAction<Group>) => {
            state.group = {
                ...action.payload,
                photoUrl: `${BOT_FILE_URL}/${action.payload.photoUrl}`
            };
        },
    }
})

export const { setRequestChats, setGroup } = hubSlice.actions;
export const hubReducer = hubSlice.reducer;