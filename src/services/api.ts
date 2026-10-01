import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { initDataRaw, retrieveRawInitData } from "@telegram-apps/sdk-react";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

/** `initData` crudo que firmó Telegram. La API lo valida en cada petición y conexión. */
export function getInitDataRaw(): string | undefined {
    return initDataRaw() ?? retrieveRawInitData();
}

/**
 * Base query de RTK Query autenticada: envía `Authorization: tma <initDataRaw>`.
 * La identidad sale siempre del `initData`, nunca de un id en el body o los headers.
 */
export function authBaseQuery(path: string) {
    return fetchBaseQuery({
        baseUrl: `${API_URL}${path}`,
        prepareHeaders: (headers) => {
            const initData = getInitDataRaw();
            if (initData) {
                headers.set('Authorization', `tma ${initData}`);
            }
            return headers;
        },
    });
}

/** Socket autenticado: la API valida `auth.initData` antes de aceptar la conexión. */
export function createSocket(): Socket {
    return io(API_URL, {
        auth: (callback) => callback({ initData: getInitDataRaw() }),
    });
}
