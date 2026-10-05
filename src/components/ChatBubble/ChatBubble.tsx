import { themeParams } from "@telegram-apps/sdk-react";
import { Caption, Spinner } from "@telegram-apps/telegram-ui";
import { FC, useState } from "react";
import { initials } from "@/helpers/text";
import { MediaAvatar } from "@/components/MediaAvatar";
import { useMediaUrl } from "@/hooks/useMediaUrl";

/** Colores de nombre como los de Telegram: cada autor conserva el suyo. */
const NAME_COLORS = ['#e17076', '#faa774', '#a695e7', '#7bc862', '#6ec9cb', '#65aadd', '#ee7aae'];

function nameColor(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
}

interface ChatBubbleProps {
    /** Vacío si el mensaje es solo imágenes. */
    message: string;
    imageIds?: string[];
    /** Id del autor: fija el color de su nombre. */
    authorId: string;
    username: string;
    time: string;
    avatarMediaId?: string;
    isOwn?: boolean;
    /** Mensaje propio sin confirmar (ver `OutboxMessage`). */
    status?: 'sending' | 'failed';
    onRetry?: () => void;
}

export const ChatBubble: FC<ChatBubbleProps> = ({ message, imageIds, authorId, username, time, avatarMediaId, isOwn, status, onRetry }) => {
    const hasText = /\S/.test(message);
    const metaColor = isOwn ? themeParams.buttonTextColor() : themeParams.hintColor();
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                marginBottom: '8px',
            }}
        >
            {!isOwn && (
                <MediaAvatar size={28} mediaId={avatarMediaId} acronym={initials(username)} />
            )}
            <div
                style={{
                    maxWidth: '75%',
                    minWidth: 0,
                    backgroundColor: isOwn ? themeParams.buttonColor() : themeParams.secondaryBackgroundColor(),
                    color: isOwn ? themeParams.buttonTextColor() : themeParams.textColor(),
                    borderRadius: '12px',
                    padding: '6px 10px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    opacity: status === 'sending' ? 0.75 : 1,
                }}
            >
                {!isOwn && (
                    <Caption weight='2' style={{ color: nameColor(authorId) }}>{username}</Caption>
                )}
                {imageIds && imageIds.length > 0 && <ImageGrid imageIds={imageIds} />}
                {hasText && (
                    <span style={{ fontSize: '15px', lineHeight: '20px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                        {message}
                    </span>
                )}
                {status === 'failed' ? (
                    <button
                        type="button"
                        onClick={onRetry}
                        style={{
                            alignSelf: 'flex-end',
                            background: 'none',
                            border: 'none',
                            padding: '4px 0',
                            cursor: 'pointer',
                            color: themeParams.destructiveTextColor(),
                        }}
                    >
                        <Caption weight='2' level='2'>No enviado · Reintentar</Caption>
                    </button>
                ) : (
                    <span style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '4px', color: metaColor }}>
                        <Caption level='2' style={{ color: metaColor }}>{status === 'sending' ? 'Enviando…' : time}</Caption>
                        {/* Doble check: la API guardó el mensaje (no indica lectura). */}
                        {isOwn && !status && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label="Enviado">
                                <path d="M1.8 13.4 6 17.6l7.6-8.6" />
                                <path d="M10.4 15.4 12.4 17.6 20 9" />
                            </svg>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
};

/** Imágenes de un mensaje: una ocupa el ancho; varias van en dos columnas. */
const ImageGrid: FC<{ imageIds: string[] }> = ({ imageIds }) => {
    const single = imageIds.length === 1;
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: single ? '1fr' : '1fr 1fr',
                gap: '2px',
                width: '240px',
                maxWidth: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
            }}
        >
            {imageIds.map((id) => <ChatImage key={id} mediaId={id} single={single} />)}
        </div>
    );
};

const ChatImage: FC<{ mediaId: string; single: boolean }> = ({ mediaId, single }) => {
    const src = useMediaUrl(mediaId);
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                aria-label="Ver imagen"
                onClick={() => setOpen(true)}
                disabled={!src}
                style={{
                    padding: 0,
                    border: 0,
                    cursor: src ? 'zoom-in' : 'default',
                    aspectRatio: single ? undefined : '1',
                    minHeight: single ? '120px' : undefined,
                    background: themeParams.sectionSeparatorColor(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {src ? (
                    <img
                        src={src}
                        alt=""
                        style={{ width: '100%', height: '100%', maxHeight: single ? '320px' : undefined, objectFit: 'cover', display: 'block' }}
                    />
                ) : (
                    <Spinner size='s' />
                )}
            </button>
            {open && src && (
                <button
                    type="button"
                    aria-label="Cerrar imagen"
                    onClick={() => setOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        padding: 0,
                        border: 0,
                        background: 'rgba(0, 0, 0, 0.92)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-out',
                    }}
                >
                    <img src={src} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </button>
            )}
        </>
    );
};
