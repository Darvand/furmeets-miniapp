export interface User {
    uuid: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    telegramId: number;
    birthdate?: Date;
}