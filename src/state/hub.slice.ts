import { Group } from "@/models/group.model";
import { createSlice, PayloadAction } from "@reduxjs/toolkit/react";

interface HubState {
    group: Group | null;
}

const initialState: HubState = {
    group: null,
};

export const hubSlice = createSlice({
    name: 'hub',
    initialState,
    reducers: {
        setGroup: (state: HubState, action: PayloadAction<Group>) => {
            state.group = action.payload;
        },
    }
})

export const { setGroup } = hubSlice.actions;
export const hubReducer = hubSlice.reducer;