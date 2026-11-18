import { RequestChatItem, RequestChatVotes, RequestChatThresholds } from "@/models/request-chat.model";

/**
 * La etiqueta "Falta tu voto": la solicitud sigue en curso, el miembro no ha votado y no es
 * la suya (nadie vota su propia solicitud). No dice nada de los demás miembros (RNF-PRI-02).
 */
export function isMissingOwnVote(item: RequestChatItem, viewerUuid: string | undefined): boolean {
    return item.state === 'InProgress' && !item.userVote && item.requester.uuid !== viewerUuid;
}

/** "4/5 a favor · 1/5 en contra" */
export function votesAgainstThresholds({ approved, rejected }: RequestChatVotes, thresholds: RequestChatThresholds): string {
    return `${approved}/${thresholds.approve} a favor · ${rejected}/${thresholds.reject} en contra`;
}

/** "5 a favor · 0 en contra" */
export function votesSummary({ approved, rejected }: RequestChatVotes): string {
    return `${approved} a favor · ${rejected} en contra`;
}
