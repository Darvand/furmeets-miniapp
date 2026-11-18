import { authFetch } from "./api";

/** Lo que acepta `POST /media` (la API revisa los bytes, no solo el tipo declarado). */
export const UPLOAD_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** Límite de subida de Telegram, el mismo que aplica la API (413). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** La subida falló; `message` se puede mostrar tal cual. */
export class MediaUploadError extends Error {}

/**
 * Sube una imagen a `POST /media` y devuelve su id. Solo la ve quien la subió hasta que la
 * usa en un formulario; desde ahí, también los miembros.
 */
export async function uploadMedia(file: File): Promise<string> {
    if (!UPLOAD_IMAGE_TYPES.includes(file.type)) {
        throw new MediaUploadError('Solo se aceptan imágenes JPEG, PNG o WebP.');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        throw new MediaUploadError('La imagen pesa más de 10 MB.');
    }
    const body = new FormData();
    body.append('file', file);
    let response: Response;
    try {
        response = await authFetch('/media', { method: 'POST', body });
    } catch {
        throw new MediaUploadError('No se pudo subir. Revisa tu conexión.');
    }
    if (response.status === 400) {
        throw new MediaUploadError('Solo se aceptan imágenes JPEG, PNG o WebP.');
    }
    if (response.status === 413) {
        throw new MediaUploadError('La imagen pesa más de 10 MB.');
    }
    if (!response.ok) {
        throw new MediaUploadError('No se pudo subir. Intenta de nuevo.');
    }
    const { id } = await response.json() as { id: string };
    // Ya está en el dispositivo: mostrarla no la vuelve a descargar.
    resolved.set(id, URL.createObjectURL(file));
    return id;
}

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
