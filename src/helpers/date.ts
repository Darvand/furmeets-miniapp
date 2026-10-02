import { DateTime } from "luxon";

/**
 * Hora de un mensaje para mostrar: la API la envía en ISO-8601 UTC y aquí se pasa a la
 * zona del dispositivo. Si es de hoy, la hora ("03:05 PM"); si no, el día ("Oct 02").
 */
export function formatChatTime(iso: string, now: DateTime = DateTime.local()): string {
    const date = DateTime.fromISO(iso).toLocal();
    if (!date.isValid) {
        return '';
    }
    return date.hasSame(now, 'day') ? date.toFormat('hh:mm a') : date.toFormat('LLL dd');
}
