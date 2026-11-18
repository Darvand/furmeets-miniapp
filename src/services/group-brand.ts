import { loadMediaUrl } from "./media";

const KEY = 'furmeets.groupPhoto';
/** Una foto de grupo pesa decenas de KB; más que esto no se guarda (el almacenamiento es corto). */
const MAX_CHARS = 400_000;

/**
 * Foto del grupo de la última vez que se abrió la App. La API puede estar dormida cuando se
 * muestra la pantalla de carga, y la foto sale de la API: por eso se guarda en el
 * dispositivo. Se guarda como data URL porque una blob URL no sobrevive a la sesión.
 */
export function savedGroupPhoto(): string | undefined {
    try {
        return localStorage.getItem(KEY) ?? undefined;
    } catch {
        return undefined;
    }
}

/** Descarga la foto del grupo y la guarda para la próxima pantalla de carga. */
export async function rememberGroupPhoto(mediaId: string): Promise<void> {
    try {
        const blobUrl = await loadMediaUrl(mediaId);
        if (!blobUrl) {
            return;
        }
        const dataUrl = await toDataUrl(await (await fetch(blobUrl)).blob());
        if (dataUrl.length <= MAX_CHARS) {
            localStorage.setItem(KEY, dataUrl);
        }
    } catch {
        // Sin almacenamiento (ventana privada, cuota): la pantalla de carga usa la patita.
    }
}

function toDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen'));
        reader.readAsDataURL(blob);
    });
}
