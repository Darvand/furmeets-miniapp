import { Page } from "@/components/Page";
import { savedGroupPhoto } from "@/services/group-brand";
import { themeParams } from "@telegram-apps/sdk-react";
import { FC, useEffect, useMemo, useState } from "react";

/** La API gratuita tarda hasta ~60 s en despertar; pasado esto se avisa que va lento. */
const LIMIT_MS = 60_000;
const MESSAGE_MS = 6_000;
const ADMIN_LINK = 'https://t.me/DarvandFrovonwill';
const AMBER = '#e2a45c';

const MESSAGES = [
    'FurMeets es la comunidad furry más grande de Medellín.',
    'No olvides comisionar tu grandiosa idea con alguno de nuestros excelentes artistas.',
    'Mientras tanto, estira esas patitas.',
    'Pregunta en el grupo por el próximo meet.',
    'Tu fursona también merece un buen descanso.',
];

const Paw: FC<{ color: string }> = ({ color }) => (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <ellipse cx="12" cy="16" rx="4.2" ry="3.6" />
        <ellipse cx="6" cy="10.5" rx="1.9" ry="2.4" />
        <ellipse cx="18" cy="10.5" rx="1.9" ry="2.4" />
        <ellipse cx="9.2" cy="6" rx="1.8" ry="2.3" />
        <ellipse cx="14.8" cy="6" rx="1.8" ry="2.3" />
    </svg>
);

/**
 * Pantalla mientras `GET /me` no responde. Si responde antes, la App salta a su pantalla sin
 * esperar a la barra. `onRetry` vuelve a pedir `GET /me`.
 */
export const LoadingPage: FC<{ onRetry?: () => void }> = ({ onRetry }) => {
    const [startedAt, setStartedAt] = useState(() => Date.now());
    const [elapsed, setElapsed] = useState(0);
    // La foto del grupo es la del último uso: la primera vez no hay y se muestra la patita.
    const photo = useMemo(savedGroupPhoto, []);

    useEffect(() => {
        setElapsed(0);
        const timer = setInterval(() => setElapsed(Date.now() - startedAt), 250);
        return () => clearInterval(timer);
    }, [startedAt]);

    const onTime = elapsed < LIMIT_MS;
    const seconds = Math.floor(elapsed / 1000);
    const current = Math.floor(elapsed / MESSAGE_MS) % MESSAGES.length;

    const background = themeParams.backgroundColor() || '#17212b';
    // En el tema oscuro de Telegram el fondo de sección es igual al de la pantalla: las
    // tarjetas y las pistas de las barras usan el fondo secundario, como el diseño.
    const surface = themeParams.secondaryBackgroundColor() || '#232e3c';
    const text = themeParams.textColor() || '#f5f5f5';
    const subtitle = themeParams.subtitleTextColor() || '#a8b8c6';
    const accent = themeParams.accentTextColor() || '#6ab2f2';
    const button = themeParams.buttonColor() || '#5288c1';
    const buttonText = themeParams.buttonTextColor() || '#ffffff';
    const track = themeParams.secondaryBackgroundColor() || '#232e3c';

    const retry = () => {
        setStartedAt(Date.now());
        onRetry?.();
    };

    return (
        <Page back={false}>
            <div style={{
                minHeight: '100dvh',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '32px',
                padding: '0 32px',
                background,
                color: text,
                fontFamily: 'var(--tgui--font-family)',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div className="fm-logo" style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '48px',
                        overflow: 'hidden',
                        background: surface,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {photo
                            ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Paw color={accent} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 600 }}>FurMeets</span>
                        <span style={{ fontSize: '14px', color: subtitle, textAlign: 'center' }}>
                            {onTime ? 'Preparando la app, dame un momento…' : 'Sigo intentando conectar…'}
                        </span>
                    </div>
                </div>

                {onTime ? (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div
                                role="progressbar"
                                aria-label="Despertando el servidor"
                                aria-valuemin={0}
                                aria-valuemax={60}
                                aria-valuenow={seconds}
                                style={{ height: '6px', borderRadius: '3px', background: track, overflow: 'hidden' }}
                            >
                                <div style={{ height: '6px', borderRadius: '3px', background: button, width: `${Math.min(100, (elapsed / LIMIT_MS) * 100)}%` }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px', color: subtitle }}>
                                <span>Despertando el servidor</span>
                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{seconds} s de 60</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minHeight: '120px' }}>
                            <div key={current} className="fm-mensaje" style={{
                                background: surface,
                                borderRadius: '12px',
                                padding: '16px',
                                width: '100%',
                                boxSizing: 'border-box',
                                minHeight: '84px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <span aria-live="polite" style={{ fontSize: '15px', lineHeight: '21px', textAlign: 'center' }}>
                                    {MESSAGES[current]}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }} aria-hidden="true">
                                {MESSAGES.map((_, i) => (
                                    <span key={i} style={{
                                        width: i === current ? '18px' : '6px',
                                        height: '6px',
                                        borderRadius: '3px',
                                        background: i === current ? accent : track,
                                    }} />
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div
                                role="progressbar"
                                aria-label="Esperando al servidor"
                                style={{ position: 'relative', height: '6px', borderRadius: '3px', background: track, overflow: 'hidden' }}
                            >
                                <div className="fm-barrido" style={{ position: 'absolute', left: 0, top: 0, width: '40%', height: '6px', borderRadius: '3px', background: AMBER }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
                                <span style={{ color: AMBER }}>Más lento de lo normal</span>
                                <span style={{ color: subtitle, fontVariantNumeric: 'tabular-nums' }}>{seconds} s</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '120px' }}>
                            <div style={{ background: surface, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '15px', fontWeight: 600 }}>Esto está tardando más de lo normal</span>
                                <span style={{ fontSize: '14px', lineHeight: '20px', color: subtitle }}>
                                    El servidor sigue arrancando. Puedes esperar un poco más; si en un par de minutos no carga, escríbele a un admin del grupo.
                                </span>
                            </div>
                            <a
                                href={ADMIN_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    minHeight: '48px',
                                    borderRadius: '12px',
                                    background: button,
                                    color: buttonText,
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                Contactar a un admin
                            </a>
                            <button
                                type="button"
                                onClick={retry}
                                style={{
                                    minHeight: '44px',
                                    borderRadius: '12px',
                                    background: 'transparent',
                                    border: `1px solid ${subtitle}`,
                                    color: text,
                                    font: 'inherit',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Reintentar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Page>
    );
};
