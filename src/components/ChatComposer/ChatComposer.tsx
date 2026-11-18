import { MAX_MESSAGE_IMAGES } from "@/models/request-chat-message.model";
import { MediaUploadError, UPLOAD_IMAGE_TYPES, uploadMedia } from "@/services/media";
import type { MessageBody } from "@/services/live-updates";
import { themeParams } from "@telegram-apps/sdk-react";
import { Caption, Spinner } from "@telegram-apps/telegram-ui";
import { ChangeEvent, FC, useRef, useState } from "react";

interface Attachment {
    key: string;
    /** Vista previa local, mientras sube. */
    previewUrl: string;
    /** Id de `media` cuando terminó de subir. */
    id?: string;
}

let nextKey = 0;

const iconButton = {
    width: '44px',
    height: '44px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 0,
    padding: 0,
    cursor: 'pointer',
} as const;

/**
 * Caja para escribir: adjuntar imágenes (hasta 10 por mensaje), texto y enviar. Cada
 * imagen se sube a `POST /media` al elegirla; enviar espera a que terminen.
 */
export const ChatComposer: FC<{ onSend: (body: MessageBody) => void }> = ({ onSend }) => {
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [error, setError] = useState<string>();
    const fileInput = useRef<HTMLInputElement>(null);

    const uploading = attachments.some((a) => !a.id);
    const canSend = !uploading && (/\S/.test(content) || attachments.length > 0);

    const remove = (key: string) => {
        setAttachments((current) => current.filter((a) => a.key !== key));
    };

    const pick = (event: ChangeEvent<HTMLInputElement>) => {
        const chosen = Array.from(event.target.files ?? []);
        const room = MAX_MESSAGE_IMAGES - attachments.length;
        const files = chosen.slice(0, room);
        // Permite volver a elegir el mismo archivo después de quitarlo.
        event.target.value = '';
        setError(chosen.length > room ? `Hasta ${MAX_MESSAGE_IMAGES} imágenes por mensaje: se agregaron las primeras.` : undefined);
        for (const file of files) {
            const attachment: Attachment = { key: String(nextKey++), previewUrl: URL.createObjectURL(file) };
            setAttachments((current) => [...current, attachment]);
            uploadMedia(file).then(
                (id) => setAttachments((current) => current.map((a) => (a.key === attachment.key ? { ...a, id } : a))),
                (reason: unknown) => {
                    remove(attachment.key);
                    setError(reason instanceof MediaUploadError ? reason.message : 'No se pudo subir. Intenta de nuevo.');
                },
            );
        }
    };

    const send = () => {
        if (!canSend) {
            return;
        }
        onSend({ content, imageIds: attachments.flatMap((a) => (a.id ? [a.id] : [])) });
        // La vista previa ya no hace falta: `uploadMedia` guardó la imagen para mostrarla.
        attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
        setContent('');
        setAttachments([]);
        setError(undefined);
    };

    return (
        <div style={{ borderTop: `1px solid ${themeParams.sectionSeparatorColor()}`, flexShrink: 0 }}>
            {(attachments.length > 0 || error) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 12px 0' }}>
                    {attachments.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                            {attachments.map((a) => (
                                <div key={a.key} style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                                    <img src={a.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: a.id ? 1 : 0.5 }} />
                                    {!a.id && (
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Spinner size='s' />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        aria-label="Quitar imagen"
                                        onClick={() => remove(a.key)}
                                        style={{
                                            position: 'absolute',
                                            top: '2px',
                                            right: '2px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '10px',
                                            border: 0,
                                            padding: 0,
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {error && <Caption style={{ color: themeParams.destructiveTextColor() }}>{error}</Caption>}
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '6px' }}>
                <button
                    type="button"
                    aria-label="Adjuntar imagen"
                    onClick={() => fileInput.current?.click()}
                    disabled={attachments.length >= MAX_MESSAGE_IMAGES}
                    style={iconButton}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={themeParams.hintColor()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 11.5l-7.6 7.6a4.5 4.5 0 0 1-6.4-6.4l8-8a3 3 0 0 1 4.3 4.3l-8 8a1.5 1.5 0 0 1-2.2-2.1l7.2-7.2" />
                    </svg>
                </button>
                <input
                    ref={fileInput}
                    type="file"
                    accept={UPLOAD_IMAGE_TYPES.join(',')}
                    multiple
                    onChange={pick}
                    style={{ display: 'none' }}
                />
                <input
                    aria-label="Mensaje"
                    placeholder="Mensaje"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            send();
                        }
                    }}
                    style={{
                        flexGrow: 1,
                        minWidth: 0,
                        background: 'transparent',
                        border: 0,
                        outline: 'none',
                        color: themeParams.textColor(),
                        fontSize: '15px',
                        fontFamily: 'var(--tgui--font-family)',
                        padding: '12px 4px',
                    }}
                />
                <button type="button" aria-label="Enviar mensaje" onClick={send} disabled={!canSend} style={{ ...iconButton, opacity: canSend ? 1 : 0.4 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={themeParams.accentTextColor()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12l16-7-7 16-2.5-6.5z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
