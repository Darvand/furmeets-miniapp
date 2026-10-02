import { Group } from "@/models/group.model";
import { RequestChatItem } from "@/models/request-chat.model"
import { createSlice, PayloadAction } from "@reduxjs/toolkit/react";

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
            state.requestChats = action.payload;
        },
        setGroup: (state: HubState, action: PayloadAction<Group>) => {
            state.group = action.payload;
        },
    }
})

export const { setRequestChats, setGroup } = hubSlice.actions;
export const hubReducer = hubSlice.reducer;