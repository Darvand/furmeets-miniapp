import { MediaAvatar } from "@/components/MediaAvatar";
import { VoteBars } from "@/components/VoteBars/VoteBars";
import { formatShortDate } from "@/helpers/date";
import { isMissingOwnVote, votesAgainstThresholds, votesSummary } from "@/helpers/request-chat-list";
import { initials } from "@/helpers/text";
import { RequestChatItem, RequestChatThresholds } from "@/models/request-chat.model";
import { isMiniAppDark, themeParams } from "@telegram-apps/sdk-react";
import { Spinner } from "@telegram-apps/telegram-ui";
import { CSSProperties, FC, PropsWithChildren, ReactNode } from "react";

const rowStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    border: 0,
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
};

const nameStyle: CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const Pill: FC<PropsWithChildren<{ color?: string; background: string }>> = ({ children, color, background }) => (
    <span style={{
        flexShrink: 0,
        fontSize: '11px',
        fontWeight: 600,
        color,
        background,
        borderRadius: '12px',
        padding: '5px 9px',
    }}>
        {children}
    </span>
);

const Subtitle: FC<PropsWithChildren> = ({ children }) => (
    <span style={{ ...nameStyle, fontSize: '12px', color: themeParams.subtitleTextColor() }}>{children}</span>
);

interface OpenRowProps {
    item: RequestChatItem;
    thresholds: RequestChatThresholds;
    viewerUuid?: string;
    onSelect: (item: RequestChatItem) => void;
}

/** Una solicitud en curso: conteos contra los umbrales y, si aplica, "Falta tu voto". */
export const OpenRequestChatRow: FC<OpenRowProps> = ({ item, thresholds, viewerUuid, onSelect }) => (
    <button
        type="button"
        onClick={() => onSelect(item)}
        style={{ ...rowStyle, flexDirection: 'column', gap: '10px', padding: '12px 16px' }}
    >
        <span style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MediaAvatar size={40} mediaId={item.requester.avatarMediaId} acronym={initials(item.requester.name)} />
            <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                <span style={{ ...nameStyle, fontSize: '16px', fontWeight: 600 }}>{item.requester.name}</span>
                <Subtitle>{votesAgainstThresholds(item.votes, thresholds)}</Subtitle>
            </span>
            {isMissingOwnVote(item, viewerUuid) && (
                <Pill color={themeParams.accentTextColor()} background="rgba(106, 178, 242, 0.14)">Falta tu voto</Pill>
            )}
        </span>
        <span style={{ width: '100%' }}>
            <VoteBars votes={item.votes} thresholds={thresholds} />
        </span>
    </button>
);

const ClosedStatePill: FC<{ state: string }> = ({ state }) =>
    state === 'Approved' ? (
        // El verde del diseño es para fondo oscuro: en el tema claro no se leería.
        <Pill color={isMiniAppDark() ? '#8fd47a' : '#2e7d1f'} background="rgba(123, 200, 98, 0.14)">Aceptada</Pill>
    ) : (
        <Pill color={themeParams.subtitleTextColor()} background="rgba(168, 184, 198, 0.12)">No aprobada</Pill>
    );

/** Una solicitud cerrada: fecha, conteos finales y cómo terminó. */
export const ClosedRequestChatRow: FC<{ item: RequestChatItem; onSelect: (item: RequestChatItem) => void }> = ({ item, onSelect }) => (
    <button
        type="button"
        onClick={() => onSelect(item)}
        style={{ ...rowStyle, alignItems: 'center', gap: '12px', padding: '11px 16px' }}
    >
        <MediaAvatar size={40} mediaId={item.requester.avatarMediaId} acronym={initials(item.requester.name)} />
        <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{ ...nameStyle, fontSize: '15px' }}>{item.requester.name}</span>
            <Subtitle>{formatShortDate(item.createdAt)} · {votesSummary(item.votes)}</Subtitle>
        </span>
        <ClosedStatePill state={item.state} />
    </button>
);

interface SectionProps {
    title: string;
    /** Junto al título, a la derecha. */
    count?: number;
    isLoading?: boolean;
    emptyText: string;
    /** Hay otra página: muestra "Ver más". */
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
    children: ReactNode[];
}

/** Título, tarjeta con las filas separadas por una línea y "Ver más" si quedan páginas. */
export const RequestChatSection: FC<SectionProps> = ({ title, count, isLoading, emptyText, hasMore, isLoadingMore, onLoadMore, children }) => {
    const separator = `1px solid ${themeParams.secondaryBackgroundColor()}`;
    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '0 16px' }}>
                <span style={{ flexGrow: 1, fontSize: '13px', fontWeight: 600, color: themeParams.accentTextColor() }}>{title}</span>
                {count !== undefined && (
                    <span style={{ fontSize: '12px', color: themeParams.subtitleTextColor() }}>{count}</span>
                )}
            </div>
            <div style={{ background: themeParams.sectionBackgroundColor(), borderRadius: '12px', overflow: 'hidden' }}>
                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}><Spinner size="s" /></div>
                )}
                {!isLoading && children.length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center' }}><Subtitle>{emptyText}</Subtitle></div>
                )}
                {children.map((row, i) => (
                    <div key={i} style={{ borderTop: i > 0 ? separator : undefined }}>{row}</div>
                ))}
                {hasMore && (
                    <button
                        type="button"
                        disabled={isLoadingMore}
                        onClick={onLoadMore}
                        style={{
                            ...rowStyle,
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '44px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: themeParams.accentTextColor(),
                            borderTop: separator,
                        }}
                    >
                        {isLoadingMore ? <Spinner size="s" /> : 'Ver más'}
                    </button>
                )}
            </div>
        </section>
    );
};
