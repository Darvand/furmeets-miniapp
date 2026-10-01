import { RequestChatState, Role } from "@/models/me.model";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** Rol y solicitud del usuario según la API (`GET /me`). La App solo lo refleja. */
export interface MeState {
    role: Role;
    requestChatId?: string;
    requestChatState?: RequestChatState;
}

type NullableMe = MeState | null;

export const meSlice = createSlice({
    name: 'me',
    initialState: null as NullableMe,
    reducers: {
        setMe: (_state: NullableMe, action: PayloadAction<MeState>) => {
            return action.payload;
        },
        /**
         * La solicitud propia se creó o cambió de estado. Solo aplica a solicitantes: un
         * miembro no tiene solicitud (y un solicitante solo puede ver la suya).
         */
        setOwnRequestChat: (state: NullableMe, action: PayloadAction<{ id: string; state: RequestChatState }>) => {
            if (state?.role === 'applicant') {
                state.requestChatId = action.payload.id;
                state.requestChatState = action.payload.state;
            }
        },
    }
})

export const { setMe, setOwnRequestChat } = meSlice.actions;
export const meReducer = meSlice.reducer;
