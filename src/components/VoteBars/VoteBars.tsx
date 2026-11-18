import { RequestChatThresholds, RequestChatVotes } from "@/models/request-chat.model";
import { themeParams } from "@telegram-apps/sdk-react";
import { FC } from "react";

const Bar: FC<{ count: number; threshold: number; color?: string }> = ({ count, threshold, color }) => (
    <span style={{ flex: 1, display: 'flex', gap: '2px' }}>
        {Array.from({ length: threshold }, (_, i) => (
            <span
                key={i}
                style={{
                    flex: 1,
                    height: '5px',
                    borderRadius: '2px',
                    background: i < count ? color : themeParams.secondaryBackgroundColor(),
                }}
            />
        ))}
    </span>
);

/**
 * Dos barras, una por opción, con tantos segmentos como su umbral (SPEC §3.3). Solo decoran:
 * los conteos van también en texto junto a ellas.
 */
export const VoteBars: FC<{ votes: RequestChatVotes; thresholds: RequestChatThresholds }> = ({ votes, thresholds }) => (
    <span aria-hidden="true" style={{ display: 'flex', gap: '12px' }}>
        <Bar count={votes.approved} threshold={thresholds.approve} color={themeParams.accentTextColor()} />
        <Bar count={votes.rejected} threshold={thresholds.reject} color={themeParams.destructiveTextColor()} />
    </span>
);
