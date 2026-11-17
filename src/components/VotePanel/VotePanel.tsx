import { voteWouldClose } from "@/helpers/votes";
import { RequestChatVotes, RequestChatThresholds, RequestChatVoteType } from "@/models/request-chat.model";
import { useVoteMutation } from "@/services/request-chat.service";
import { themeParams } from "@telegram-apps/sdk-react";
import { Button, Modal, Text } from "@telegram-apps/telegram-ui";
import { CSSProperties, FC, useState } from "react";

const textButtonStyle: CSSProperties = {
    minHeight: '44px',
    padding: '0 4px',
    border: 0,
    background: 'transparent',
    font: 'inherit',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
};

const Tally: FC<{ label: string; count: number; threshold: number; color?: string }> = ({ label, count, threshold, color }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '11px', color: themeParams.subtitleTextColor() }}>{label}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
                {Math.min(count, threshold)}/{threshold}
            </span>
        </div>
        <div aria-hidden="true" style={{ display: 'flex', gap: '3px' }}>
            {Array.from({ length: threshold }, (_, i) => (
                <span
                    key={i}
                    style={{
                        flex: 1,
                        height: '8px',
                        borderRadius: '3px',
                        background: i < count ? color : themeParams.sectionSeparatorColor(),
                    }}
                />
            ))}
        </div>
    </div>
);

/** Los conteos contra los umbrales: nunca quién votó (RNF-PRI-01). */
export const VoteTallies: FC<{ votes: RequestChatVotes; thresholds: RequestChatThresholds }> = ({ votes, thresholds }) => (
    <div style={{ display: 'flex', gap: '16px' }}>
        <Tally label="Aceptar" count={votes.approved} threshold={thresholds.approve} color={themeParams.accentTextColor()} />
        <Tally label="Rechazar" count={votes.rejected} threshold={thresholds.reject} color={themeParams.destructiveTextColor()} />
    </div>
);

export interface VoteControlsProps {
    requestChatId: string;
    requesterName: string;
    state: string;
    votes: RequestChatVotes;
    thresholds: RequestChatThresholds;
    userVote?: RequestChatVoteType;
    /** La solicitud es de quien mira: ve los conteos, pero no vota. */
    isOwn: boolean;
}

const VOTE_LABEL: Record<RequestChatVoteType, string> = {
    approve: 'Votaste aceptar',
    reject: 'Votaste rechazar',
};

function statusText({ state, thresholds }: VoteControlsProps): string {
    if (state === 'Approved') {
        return `Llegó a ${thresholds.approve} a favor: la solicitud se aprobó`;
    }
    if (state === 'Rejected') {
        return `Llegó a ${thresholds.reject} en contra: la solicitud no se aprobó`;
    }
    return thresholds.approve === thresholds.reject
        ? `Gana la primera opción que llegue a ${thresholds.approve}`
        : `Se acepta con ${thresholds.approve} a favor y se rechaza con ${thresholds.reject} en contra`;
}

/**
 * Votar, cambiar y retirar el voto. El voto se ve al instante (optimista) y se revierte si la
 * API lo rechaza. Solo pide confirmar el voto que cerraría la solicitud: es el único que ya
 * no se puede cambiar. Ningún texto dice que el grupo ve el voto: es anónimo.
 */
export const VoteControls: FC<VoteControlsProps> = (props) => {
    const { requestChatId, state, votes, thresholds, userVote, isOwn } = props;
    const [vote, { isLoading }] = useVoteMutation();
    const [confirming, setConfirming] = useState<RequestChatVoteType | null>(null);
    const isOpen = state === 'InProgress';

    const send = (type: RequestChatVoteType) => {
        setConfirming(null);
        if (!isLoading) {
            void vote({ id: requestChatId, type });
        }
    };
    const request = (type: RequestChatVoteType) => {
        if (voteWouldClose({ votes, userVote }, type, thresholds)) {
            setConfirming(type);
        } else {
            send(type);
        }
    };
    const other: RequestChatVoteType = userVote === 'approve' ? 'reject' : 'approve';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Modal open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px', textAlign: 'center' }}>
                    <Text>
                        {confirming === 'approve'
                            ? 'Tu voto cierra la solicitud: se aprobará y ya no se podrá cambiar.'
                            : 'Tu voto cierra la solicitud: no se aprobará y ya no se podrá cambiar.'}
                    </Text>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button mode="gray" onClick={() => setConfirming(null)}>Cancelar</Button>
                        <Button onClick={() => confirming && send(confirming)}>Votar</Button>
                    </div>
                </div>
            </Modal>

            {isOpen && !isOwn && !userVote && (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button stretched mode="outline" disabled={isLoading} style={{ color: themeParams.destructiveTextColor() }} onClick={() => request('reject')}>
                        Rechazar
                    </Button>
                    <Button stretched disabled={isLoading} onClick={() => request('approve')}>Aceptar</Button>
                </div>
            )}

            {userVote && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: '12px', minHeight: '44px' }}>
                    <span style={{ flexGrow: 1, fontSize: '14px', fontWeight: 600 }}>{VOTE_LABEL[userVote]}</span>
                    {isOpen && (
                        <>
                            <button type="button" disabled={isLoading} style={{ ...textButtonStyle, color: themeParams.accentTextColor() }} onClick={() => request(other)}>
                                Cambiar a {other === 'approve' ? 'aceptar' : 'rechazar'}
                            </button>
                            <button type="button" disabled={isLoading} style={{ ...textButtonStyle, color: themeParams.accentTextColor() }} onClick={() => send(userVote)}>
                                Retirar voto
                            </button>
                        </>
                    )}
                </div>
            )}

            <span style={{ fontSize: '11px', color: themeParams.subtitleTextColor() }}>
                {isOwn && isOpen ? 'Es tu solicitud: no puedes votarla.' : statusText(props)}
            </span>
        </div>
    );
};

function shortStatus({ state, userVote, isOwn }: VoteControlsProps): { text: string; color?: string } {
    if (state === 'Approved') {
        return { text: 'Aceptada', color: themeParams.accentTextColor() };
    }
    if (state === 'Rejected') {
        return { text: 'No aprobada', color: themeParams.subtitleTextColor() };
    }
    if (isOwn) {
        return { text: '', color: undefined };
    }
    return userVote
        ? { text: 'Ya votaste', color: themeParams.subtitleTextColor() }
        : { text: 'Falta tu voto', color: themeParams.accentTextColor() };
}

/**
 * Votación del chat de miembros: plegada muestra las dos barras; abierta, además, el voto
 * propio y los botones. La API no le envía nada de esto al solicitante (RNF-PRI-03).
 */
export const VotePanel: FC<VoteControlsProps> = (props) => {
    const [expanded, setExpanded] = useState(false);
    const { requesterName, votes, thresholds, isOwn, state } = props;
    const status = shortStatus(props);
    return (
        <div style={{
            flexShrink: 0,
            padding: '2px 12px 12px',
            background: themeParams.secondaryBackgroundColor(),
            borderTop: `1px solid ${themeParams.sectionSeparatorColor()}`,
            fontFamily: 'var(--tgui--font-family)',
            color: themeParams.textColor(),
        }}>
            <button
                type="button"
                aria-expanded={expanded}
                aria-label="Mostrar u ocultar la votación"
                onClick={() => setExpanded(!expanded)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: '44px',
                    padding: 0,
                    border: 0,
                    background: 'transparent',
                    font: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                }}
            >
                <span style={{ flexGrow: 1, fontSize: '11px', color: themeParams.subtitleTextColor() }}>
                    {isOwn ? 'Votación' : `Votación · no la ve ${requesterName}`}
                </span>
                <span style={{ flexShrink: 0, fontSize: '12px', fontWeight: 600, color: status.color }}>{status.text}</span>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={themeParams.hintColor()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d={expanded ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
                </svg>
            </button>
            <VoteTallies votes={votes} thresholds={thresholds} />
            {expanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {state === 'InProgress' && !isOwn && (
                        <span style={{ fontSize: '15px', fontWeight: 600 }}>¿Aceptamos a {requesterName}?</span>
                    )}
                    <VoteControls {...props} />
                </div>
            )}
        </div>
    );
};
