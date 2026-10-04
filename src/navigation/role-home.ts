import { MeState } from "@/state/me.slice";

/**
 * Pantalla de inicio según el flujo principal (SPEC §1):
 * miembro → Inicio; solicitante sin solicitud → Bienvenida (y de ahí al Formulario); con
 * solicitud en curso → su chat; aprobada → Aprobado; rechazada → No aprobado.
 */
export function homePathFor(me: MeState): string {
    if (me.role === 'member') {
        return '/';
    }
    if (!me.requestChatId) {
        return '/welcome';
    }
    switch (me.requestChatState) {
        case 'Approved':
            return '/approved';
        case 'Rejected':
            return '/not-approved';
        default:
            return `/request-chat/${me.requestChatId}`;
    }
}
