import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * Mensaje propio aún sin confirmar. Vive aparte de la caché de RTK Query (que solo guarda
 * lo que confirmó la API), así una recarga de la caché no lo pierde.
 */
export interface OutboxMessage {
    /** Lo genera la App; la API lo devuelve en el ack y en el evento del mensaje. */
    clientMessageId: string;
    requestChatUUID: string;
    content: string;
    /** ISO-8601 UTC, del momento en que se escribió. */
    sentAt: string;
    status: 'sending' | 'failed';
}

export const outboxSlice = createSlice({
    name: 'outbox',
    initialState: [] as OutboxMessage[],
    reducers: {
        /** Un mensaje nuevo, o uno fallido que se reintenta. */
        sending: (state, action: PayloadAction<Omit<OutboxMessage, 'status'>>) => {
            const existing = state.find((m) => m.clientMessageId === action.payload.clientMessageId);
            if (existing) {
                existing.status = 'sending';
                return;
            }
            state.push({ ...action.payload, status: 'sending' });
        },
        /** La API lo rechazó o no confirmó a tiempo: queda "no enviado", con reintento. */
        failed: (state, action: PayloadAction<string>) => {
            const message = state.find((m) => m.clientMessageId === action.payload);
            if (message) {
                message.status = 'failed';
            }
        },
        /** La API lo confirmó: desde ahora está en la caché como cualquier otro mensaje. */
        confirmed: (state, action: PayloadAction<string>) => {
            return state.filter((m) => m.clientMessageId !== action.payload);
        },
    },
});

export const outboxActions = outboxSlice.actions;
export const outboxReducer = outboxSlice.reducer;
