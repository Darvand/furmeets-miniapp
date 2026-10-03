import { Socket } from "socket.io-client";
import { createSocket } from "./api";

let socket: Socket | undefined;

/**
 * El único socket de la App: se crea la primera vez que se pide y vive mientras la App
 * esté abierta. Las páginas no abren ni cierran conexiones (plan, deuda #9).
 */
export function getSocket(): Socket {
    socket ??= createSocket();
    return socket;
}
