import { User } from "./user.model";

export interface Group {
    uuid: string;
    name: string;
    telegramId: number;
    photoUrl: string;
    description: string;
    members: User[];
}