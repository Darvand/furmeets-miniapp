import { RequestChat } from "@/models/request-chat.model"
import { createSlice, PayloadAction } from "@reduxjs/toolkit/react";

interface HubState {
    requestChats: RequestChat[];
}

const initialState: HubState = {
    requestChats: [],
};

export const hubSlice = createSlice({
    name: 'hub',
    initialState,
    reducers: {
        setRequestChats: (state: HubState, action: PayloadAction<RequestChat[]>) => {
            state.requestChats = action.payload;
        }
    }
})

export const { setRequestChats } = hubSlice.actions;
export const hubReducer = hubSlice.reducer;