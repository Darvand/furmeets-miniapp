import { User } from "./user.model";

export type Role = 'member' | 'applicant';

export type RequestChatState = 'InProgress' | 'Approved' | 'Rejected';

/** Respuesta de `GET /me`: todo lo necesario para enrutar al abrir la App (SPEC §1). */
export interface Me {
    user: User;
    role: Role;
    /** Solo para solicitantes que ya enviaron su solicitud. */
    requestChatId?: string;
    requestChatState?: RequestChatState;
}
