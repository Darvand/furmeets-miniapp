import { authFetch } from "./api";

/** Blob URLs ya descargadas: un avatar que aparece en muchas burbujas se pide una vez. */
const resolved = new Map<string, string>();
/** Descargas en curso, compartidas entre quienes piden la misma imagen a la vez. */
const pending = new Map<string, Promise<string | undefined>>();

/** Blob URL de una imagen ya descargada, sin pedirla. */
export function cachedMediaUrl(mediaId: string): string | undefined {
    return resolved.get(mediaId);
}

/**
 * Descarga una imagen de `GET /media/:id` (con `Authorization: tma …`, que un `<img>` no
 * puede enviar) y devuelve una blob URL. Las imágenes nunca vienen de Telegram
 * directamente: su URL lleva el token del bot. Si falla, devuelve `undefined` y la
 * siguiente llamada lo vuelve a intentar.
 */
export function loadMediaUrl(mediaId: string): Promise<string | undefined> {
    const url = resolved.get(mediaId);
    if (url) {
        return Promise.resolve(url);
    }
    let loading = pending.get(mediaId);
    if (!loading) {
        loading = download(mediaId).finally(() => pending.delete(mediaId));
        pending.set(mediaId, loading);
    }
    return loading;
}

async function download(mediaId: string): Promise<string | undefined> {
    try {
        const response = await authFetch(`/media/${encodeURIComponent(mediaId)}`);
        if (!response.ok) {
            return undefined;
        }
        const url = URL.createObjectURL(await response.blob());
        resolved.set(mediaId, url);
        return url;
    } catch {
        return undefined;
    }
}
