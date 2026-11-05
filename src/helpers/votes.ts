import { RequestChatThresholds, RequestChatVotes, RequestChatVoteType } from "@/models/request-chat.model";

interface VoteState {
    votes: RequestChatVotes;
    userVote?: RequestChatVoteType;
}

const COUNT: Record<RequestChatVoteType, keyof RequestChatVotes> = {
    approve: 'approved',
    reject: 'rejected',
};

/**
 * Lo que hará la API con el voto propio, para mostrarlo antes de su respuesta: repetir el
 * mismo voto lo retira y uno distinto reemplaza al anterior.
 */
export function toggleOwnVote({ votes, userVote }: VoteState, type: RequestChatVoteType): VoteState {
    const next = { ...votes };
    if (userVote) {
        next[COUNT[userVote]] = Math.max(0, next[COUNT[userVote]] - 1);
    }
    if (userVote === type) {
        return { votes: next, userVote: undefined };
    }
    next[COUNT[type]] += 1;
    return { votes: next, userVote: type };
}

/** Este voto alcanza el umbral: cierra la solicitud en el acto y ya no se puede cambiar. */
export function voteWouldClose(state: VoteState, type: RequestChatVoteType, thresholds: RequestChatThresholds): boolean {
    const { votes } = toggleOwnVote(state, type);
    return votes.approved >= thresholds.approve || votes.rejected >= thresholds.reject;
}
