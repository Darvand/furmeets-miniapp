import { retrieveLaunchParams } from "@telegram-apps/sdk-react";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let taken = false;

/**
 * La solicitud del enlace `startapp=<id>` de los avisos al grupo. Se entrega una sola vez:
 * al volver al inicio desde ese chat, no se abre de nuevo.
 */
export function takeStartRequestChatId(): string | undefined {
    if (taken) {
        return undefined;
    }
    taken = true;
    const param = retrieveLaunchParams().tgWebAppStartParam;
    return param && UUID_PATTERN.test(param) ? param : undefined;
}
