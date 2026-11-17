import { ChatImage } from '@/components/ChatBubble/ChatBubble';
import { MediaAvatar } from '@/components/MediaAvatar';
import { Page } from '@/components/Page';
import { VoteControls, VoteTallies } from '@/components/VotePanel/VotePanel';
import { formatShortDate } from '@/helpers/date';
import { initials } from '@/helpers/text';
import { RequestChat } from '@/models/request-chat.model';
import { useGetRequestChatByIdQuery, useSetEndorsementMutation } from '@/services/request-chat.service';
import { RootState } from '@/state/store';
import { themeParams } from '@telegram-apps/sdk-react';
import { Spinner } from '@telegram-apps/telegram-ui';
import { CSSProperties, FC, PropsWithChildren, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';

const separator = () => `1px solid ${themeParams.secondaryBackgroundColor()}`;

const pillStyle: CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '12px',
    padding: '5px 10px',
};

const textButtonStyle: CSSProperties = {
    border: 0,
    background: 'transparent',
    font: 'inherit',
    fontSize: '13px',
    fontWeight: 600,
    minHeight: '44px',
    padding: '0 4px',
    cursor: 'pointer',
};

const Section: FC<PropsWithChildren<{ title: string; count?: number }>> = ({ title, count, children }) => (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '0 16px' }}>
            <h2 style={{ flexGrow: 1, margin: 0, fontSize: '13px', fontWeight: 600, color: themeParams.accentTextColor() }}>{title}</h2>
            {count !== undefined && <span style={{ fontSize: '12px', color: themeParams.subtitleTextColor() }}>{count}</span>}
        </div>
        <div style={{ background: themeParams.sectionBackgroundColor(), borderRadius: '12px', overflow: 'hidden' }}>{children}</div>
    </section>
);

/** Dato corto: etiqueta a la izquierda, valor a la derecha. El texto del solicitante puede ser largo. */
const Row: FC<{ label: string; value?: ReactNode }> = ({ label, value }) => value ? (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', borderTop: separator() }}>
        <span style={{ flexShrink: 0, fontSize: '14px', color: themeParams.subtitleTextColor() }}>{label}</span>
        <span style={{ fontSize: '15px', textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</span>
    </div>
) : null;

const Answer: FC<{ question: string; answer: string }> = ({ question, answer }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 16px', borderTop: separator() }}>
        <span style={{ fontSize: '13px', color: themeParams.subtitleTextColor() }}>{question}</span>
        <span style={{ fontSize: '15px', lineHeight: '20px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{answer}</span>
    </div>
);

function answersOf({ form, legacy }: RequestChat): { question: string; answer?: string }[] {
    if (form) {
        return [
            { question: '¿Cómo conociste FurMeets?', answer: form.howDidYouFindUs },
            { question: '¿Conoces a alguien del grupo?', answer: form.knowsSomeone },
            { question: '¿Has ido a algún meet antes?', answer: form.previousMeets },
        ];
    }
    return [
        { question: '¿Cómo conociste FurMeets?', answer: legacy?.howDidYouFindUs },
        { question: '¿Cuáles son tus intereses?', answer: legacy?.interests },
    ];
}

const Endorsements: FC<{ requestChat: RequestChat; viewerUuid?: string }> = ({ requestChat, viewerUuid }) => {
    const [setEndorsement, { isLoading: isBusy, isError: failed }] = useSetEndorsementMutation();
    const endorsements = requestChat.endorsements ?? [];
    const canEndorse = requestChat.state === 'InProgress' && requestChat.requester.uuid !== viewerUuid;
    const endorsed = endorsements.some((e) => e.endorser.uuid === viewerUuid);
    return (
        <Section title="Avales" count={endorsements.length}>
            {endorsements.map(({ endorser, at }, i) => (
                <div key={endorser.uuid} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderTop: i > 0 ? separator() : undefined }}>
                    <MediaAvatar size={28} mediaId={endorser.avatarMediaId} acronym={initials(endorser.name)} />
                    <span style={{ flexGrow: 1, minWidth: 0, fontSize: '15px', overflowWrap: 'anywhere' }}>{endorser.name}</span>
                    <span style={{ flexShrink: 0, fontSize: '12px', color: themeParams.subtitleTextColor() }}>avaló el {formatShortDate(at)}</span>
                </div>
            ))}
            {endorsements.length === 0 && !canEndorse && (
                <div style={{ padding: '12px 16px', fontSize: '13px', color: themeParams.subtitleTextColor() }}>Nadie avaló esta solicitud.</div>
            )}
            {canEndorse && !endorsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', borderTop: endorsements.length ? separator() : undefined }}>
                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void setEndorsement({ id: requestChat.uuid, endorsed: true })}
                        style={{
                            ...textButtonStyle,
                            width: '100%',
                            borderRadius: '12px',
                            border: `1px solid ${themeParams.accentTextColor()}`,
                            fontSize: '14px',
                            color: themeParams.accentTextColor(),
                        }}
                    >
                        Lo conozco, lo avalo
                    </button>
                    <span style={{ fontSize: '11px', lineHeight: '16px', color: themeParams.subtitleTextColor() }}>
                        El aval lleva tu nombre y lo ve todo el grupo. Úsalo solo si conoces al solicitante.
                    </span>
                </div>
            )}
            {canEndorse && endorsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px 0 16px', borderTop: separator() }}>
                    <span style={{ flexGrow: 1, fontSize: '13px', color: themeParams.subtitleTextColor() }}>Avalaste a {requestChat.requester.name}</span>
                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void setEndorsement({ id: requestChat.uuid, endorsed: false })}
                        style={{ ...textButtonStyle, color: themeParams.accentTextColor() }}
                    >
                        Retirar aval
                    </button>
                </div>
            )}
            {failed && (
                <div role="alert" style={{ padding: '0 16px 12px', fontSize: '12px', color: themeParams.destructiveTextColor() }}>
                    No se pudo guardar. Inténtalo de nuevo.
                </div>
            )}
        </Section>
    );
};

/** Resumen de una solicitud (artboard *Resumen*), solo para miembros. */
export const RequestSummaryPage: FC = () => {
    const { uuid } = useParams<{ uuid: string }>();
    const { data: requestChat, error, isError, refetch } = useGetRequestChatByIdQuery(uuid!);
    const user = useSelector((state: RootState) => state.user);
    const navigate = useNavigate();
    const location = useLocation();

    if (!requestChat && error && 'status' in error && [400, 403, 404].includes(error.status as number)) {
        return <Navigate to="/" replace />;
    }
    if (isError && !requestChat) {
        return <Page>No se pudo cargar la solicitud. <button onClick={() => void refetch()}>Reintentar</button></Page>;
    }
    if (!requestChat) {
        return (
            <Page>
                <div style={{ height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spinner size="m" /></div>
            </Page>
        );
    }

    const { requester, form, legacy, votes, thresholds } = requestChat;
    const answers = answersOf(requestChat).filter((a): a is { question: string; answer: string } => !!a.answer);
    const hasFursona = !!(form?.imageIds?.length || form?.species || form?.fursonaName);
    const endorsementsCount = requestChat.endorsements?.length ?? 0;
    // Vino del chat: vuelve a ese. Del historial o de un enlace: lo abre encima.
    const openChat = () => {
        if ((location.state as { fromChat?: boolean } | null)?.fromChat) {
            navigate(-1);
        } else {
            navigate(`/request-chat/${requestChat.uuid}`);
        }
    };

    return (
        <Page>
            <div style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '12px',
                boxSizing: 'border-box',
                fontFamily: 'var(--tgui--font-family)',
                color: themeParams.textColor(),
                background: themeParams.secondaryBackgroundColor(),
            }}>
                <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px 16px 16px', borderRadius: '12px', background: themeParams.sectionBackgroundColor() }}>
                    <MediaAvatar size={96} mediaId={requester.avatarMediaId} acronym={initials(requester.name)} />
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, textAlign: 'center', overflowWrap: 'anywhere' }}>{requester.name}</h1>
                    {requester.username && <span style={{ fontSize: '14px', color: themeParams.accentTextColor() }}>@{requester.username}</span>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                        {form?.isMinor && (
                            <span style={{ ...pillStyle, color: themeParams.destructiveTextColor(), background: 'rgba(236, 57, 66, 0.14)' }}>Menor de edad</span>
                        )}
                        <span style={{ ...pillStyle, color: themeParams.subtitleTextColor(), background: 'rgba(168, 184, 198, 0.12)' }}>
                            {endorsementsCount === 1 ? '1 aval' : `${endorsementsCount} avales`}
                        </span>
                        {requestChat.createdAt && (
                            <span style={{ ...pillStyle, color: themeParams.subtitleTextColor(), background: 'rgba(168, 184, 198, 0.12)' }}>
                                Solicitud del {formatShortDate(requestChat.createdAt)}
                            </span>
                        )}
                    </div>
                </header>

                {legacy && !form && (
                    <div style={{ padding: '12px 16px', borderRadius: '12px', fontSize: '13px', textAlign: 'center', color: themeParams.subtitleTextColor(), background: themeParams.sectionBackgroundColor() }}>
                        Solicitud anterior al formulario actual
                    </div>
                )}

                {hasFursona && (
                    <Section title="Fursona">
                        {!!form?.imageIds?.length && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', padding: '12px' }}>
                                {form.imageIds.map((id) => <ChatImage key={id} mediaId={id} single={false} />)}
                            </div>
                        )}
                        <Row label="Especie" value={form?.species} />
                        <Row label="Nombre fursona" value={form?.fursonaName} />
                    </Section>
                )}

                {form && (
                    <Section title="Datos">
                        <Row label="Ciudad" value={form.city} />
                        <Row label="Edad" value={`${form.age} · declarada`} />
                        <Row label="Redes" value={form.socialLinks} />
                    </Section>
                )}

                {answers.length > 0 && (
                    <Section title="Respuestas del formulario">
                        {answers.map((a) => <Answer key={a.question} {...a} />)}
                    </Section>
                )}

                <Endorsements requestChat={requestChat} viewerUuid={user?.uuid} />

                {votes && thresholds && (
                    <Section title="Votación del grupo">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 16px' }}>
                            <VoteTallies votes={votes} thresholds={thresholds} />
                            <VoteControls
                                requestChatId={requestChat.uuid}
                                requesterName={requester.name}
                                state={requestChat.state}
                                votes={votes}
                                thresholds={thresholds}
                                userVote={requestChat.userVote}
                                isOwn={requester.uuid === user?.uuid}
                            />
                            <button type="button" onClick={openChat} style={{ ...textButtonStyle, alignSelf: 'flex-end', color: themeParams.accentTextColor() }}>
                                Ver el chat
                            </button>
                        </div>
                    </Section>
                )}
            </div>
        </Page>
    );
};
