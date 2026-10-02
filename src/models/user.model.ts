export interface User {
    uuid: string;
    name: string;
    username?: string;
    /** Se pide a `GET /media/:id` (ver `MediaAvatar`). */
    avatarMediaId?: string;
    telegramId: number;
    birthdate?: Date;
}