import { Page } from "@/components/Page";
import { StepProgress } from "@/components/StepProgress";
import { meApi } from "@/services/me.service";
import { AppDispatch, RootState } from "@/state/store";
import { openTelegramLink, themeParams } from "@telegram-apps/sdk-react";
import { Button, Caption, Spinner, Text, Title } from "@telegram-apps/telegram-ui";
import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

/** El enlace lo crea una cola justo después del cierre: se espera unos segundos y se rinde. */
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 5;

const TELEGRAM_LINK = /^https:\/\/t\.me\//;

function openInvite(link: string) {
    if (TELEGRAM_LINK.test(link) && openTelegramLink.isAvailable()) {
        openTelegramLink(link);
    } else {
        window.open(link, '_blank', 'noopener');
    }
}

/**
 * Pide `GET /me` hasta que llegue el enlace de admisión, con un máximo de intentos.
 * Devuelve si sigue esperando.
 */
function useInviteLinkPolling(hasLink: boolean): boolean {
    const dispatch = useDispatch<AppDispatch>();
    const [polls, setPolls] = useState(0);
    const waiting = !hasLink && polls < MAX_POLLS;
    useEffect(() => {
        if (!waiting) {
            return;
        }
        const timer = setTimeout(() => {
            setPolls((n) => n + 1);
            void dispatch(meApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }));
        }, POLL_INTERVAL_MS);
        return () => clearTimeout(timer);
    }, [waiting, polls, dispatch]);
    return waiting;
}

/** Solicitud aprobada: paso 3 de 3, con el enlace para pedir la unión al grupo (SPEC §3.4). */
export const ApprovedPage: FC = () => {
    const me = useSelector((state: RootState) => state.me);
    const navigate = useNavigate();
    const inviteLink = me?.inviteLink;
    const waiting = useInviteLinkPolling(Boolean(inviteLink));

    return (
        <Page back={false}>
            <StepProgress step={3} label="resultado" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                <Title weight="1">¡Tu solicitud fue aprobada!</Title>
                <Text style={{ color: themeParams.subtitleTextColor() }}>
                    El grupo te dio la bienvenida. Solo falta que pidas unirte con tu enlace personal.
                </Text>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
                {inviteLink && (
                    <>
                        <Button size="l" stretched onClick={() => openInvite(inviteLink)}>
                            Unirme al grupo
                        </Button>
                        <Caption style={{ color: themeParams.subtitleTextColor() }}>
                            El enlace es solo tuyo y vence en una semana: úsalo antes de que caduque.
                        </Caption>
                    </>
                )}
                {!inviteLink && waiting && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Spinner size="s" />
                        <Caption style={{ color: themeParams.subtitleTextColor() }}>
                            Estamos preparando tu enlace…
                        </Caption>
                    </div>
                )}
                {!inviteLink && !waiting && (
                    <Text style={{ color: themeParams.subtitleTextColor() }}>
                        No pudimos mostrarte tu enlace. Un admin te lo enviará por mensaje privado.
                    </Text>
                )}
                {me?.requestChatId && (
                    <Button size="m" mode="bezeled" stretched onClick={() => navigate(`/request-chat/${me.requestChatId}`)}>
                        Ver el chat
                    </Button>
                )}
            </div>
        </Page>
    );
}
