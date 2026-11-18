import { MAX_FORM_IMAGES } from "@/models/application.model";
import { MediaUploadError, UPLOAD_IMAGE_TYPES, uploadMedia } from "@/services/media";
import { themeParams } from "@telegram-apps/sdk-react";
import { Caption, Spinner } from "@telegram-apps/telegram-ui";
import { ChangeEvent, FC, useEffect, useRef, useState } from "react";

interface Slot {
    key: string;
    /** Vista previa local, mientras sube y después. */
    previewUrl: string;
    /** Id de `media` cuando terminó de subir. */
    id?: string;
}

export interface ImagePickerValue {
    /** Las ya subidas, en orden. */
    imageIds: string[];
    /** Hay alguna subiendo: el formulario espera a que termine. */
    uploading: boolean;
}

let nextKey = 0;

/**
 * Fotos o referencias de la fursona (hasta 3). Cada una se sube a `POST /media` al
 * elegirla, así enviar el formulario no espera las subidas.
 */
export const ImagePicker: FC<{ onChange: (value: ImagePickerValue) => void }> = ({ onChange }) => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [error, setError] = useState<string>();
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        onChange({
            imageIds: slots.flatMap((slot) => (slot.id ? [slot.id] : [])),
            uploading: slots.some((slot) => !slot.id),
        });
    }, [slots, onChange]);

    const remove = (key: string) => {
        setSlots((current) => current.filter((slot) => {
            if (slot.key === key) {
                URL.revokeObjectURL(slot.previewUrl);
            }
            return slot.key !== key;
        }));
    };

    const pick = (event: ChangeEvent<HTMLInputElement>) => {
        const chosen = Array.from(event.target.files ?? []);
        const room = MAX_FORM_IMAGES - slots.length;
        const files = chosen.slice(0, room);
        // Permite volver a elegir el mismo archivo después de quitarlo.
        event.target.value = '';
        setError(chosen.length > room ? `Solo caben ${MAX_FORM_IMAGES} imágenes: se agregaron las primeras.` : undefined);
        for (const file of files) {
            const slot: Slot = { key: String(nextKey++), previewUrl: URL.createObjectURL(file) };
            setSlots((current) => [...current, slot]);
            uploadMedia(file).then(
                (id) => setSlots((current) => current.map((s) => (s.key === slot.key ? { ...s, id } : s))),
                (reason: unknown) => {
                    remove(slot.key);
                    setError(reason instanceof MediaUploadError ? reason.message : 'No se pudo subir. Intenta de nuevo.');
                },
            );
        }
    };

    const tile = {
        aspectRatio: '1',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        background: themeParams.secondaryBackgroundColor(),
    } as const;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <Caption style={{ flexGrow: 1, color: themeParams.subtitleTextColor() }}>Fotos o referencias</Caption>
                <Caption style={{ color: themeParams.subtitleTextColor() }}>{slots.length} de {MAX_FORM_IMAGES}</Caption>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MAX_FORM_IMAGES}, minmax(0, 1fr))`, gap: '8px' }}>
                {slots.map((slot, i) => (
                    <div key={slot.key} style={tile}>
                        <img src={slot.previewUrl} alt={`Foto ${i + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: slot.id ? 1 : 0.5 }} />
                        {!slot.id && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Spinner size="s" />
                            </div>
                        )}
                        <button type="button" aria-label={`Quitar la foto ${i + 1}`} onClick={() => remove(slot.key)}
                            style={{
                                position: 'absolute', top: 0, right: 0, width: '44px', height: '44px', border: 0,
                                background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'flex-start',
                                justifyContent: 'flex-end', padding: '6px',
                            }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="11" fill="rgba(0, 0, 0, 0.6)" />
                                <path d="M8 8l8 8M16 8l-8 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                ))}
                {slots.length < MAX_FORM_IMAGES && (
                    <button type="button" onClick={() => input.current?.click()}
                        style={{
                            ...tile, border: `1px dashed ${themeParams.accentTextColor()}`, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '4px', color: themeParams.accentTextColor(), font: 'inherit',
                        }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        <Caption weight="2">Subir</Caption>
                    </button>
                )}
            </div>
            <input ref={input} type="file" accept={UPLOAD_IMAGE_TYPES.join(',')} multiple hidden onChange={pick} />
            <Caption style={{ color: error ? themeParams.destructiveTextColor() : themeParams.subtitleTextColor() }}
                role={error ? 'alert' : undefined}>
                {error ?? 'Hasta 3 imágenes JPEG, PNG o WebP de hasta 10 MB.'}
            </Caption>
        </div>
    );
}
