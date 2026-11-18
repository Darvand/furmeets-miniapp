import { User } from "./user.model";

/** Imágenes por mensaje: lo que acepta la API (un álbum de Telegram). */
export const MAX_MESSAGE_IMAGES = 10;

/** Texto corto de un mensaje para el listado: el contenido o, si es solo imágenes, eso. */
export function messagePreview(content: string): string {
    return /\S/.test(content) ? content : '📷 Imagen';
}

export interface RequestChatMessage {
    uuid: string;
    requestChatUUID: string;
    /** Solo en el ack y el evento de un mensaje recién enviado (ver `OutboxMessage`). */
    clientMessageId?: string;
    user: User;
    /** Vacío si el mensaje es solo imágenes. */
    content: string;
    /** Ids de `media` (se ven con `GET /media/:id`); falta si no tiene imágenes. */
    imageIds?: string[];
    /** ISO-8601 UTC (ver `formatChatTime`). */
    sentAt: string;
}