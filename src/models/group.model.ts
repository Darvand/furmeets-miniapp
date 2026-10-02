import { User } from "./user.model";

export interface Group {
    uuid: string;
    name: string;
    telegramId: number;
    /** Se pide a `GET /media/:id` (ver `MediaAvatar`). */
    photoMediaId?: string;
    description: string;
    members: User[];
}