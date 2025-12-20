import { User } from "@/models/user.model";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type NullableUser = User | null;

export const userSlice = createSlice({
    name: 'user',
    initialState: null as NullableUser,
    reducers: {
        setUser: (_state: NullableUser, action: PayloadAction<User>) => {
            return action.payload;
        }
    }
})

export const { setUser } = userSlice.actions;
export const userReducer = userSlice.reducer;