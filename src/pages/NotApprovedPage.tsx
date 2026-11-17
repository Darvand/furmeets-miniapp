import { Page } from "@/components/Page";
import { RootState } from "@/state/store";
import { themeParams } from "@telegram-apps/sdk-react";
import { Button, Text, Title } from "@telegram-apps/telegram-ui";
import { FC } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

/** Solicitud no aprobada: sin prometer reintento (SPEC §3). */
export const NotApprovedPage: FC = () => {
    const me = useSelector((state: RootState) => state.me);
    const navigate = useNavigate();
    return (
        <Page back={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '32px 16px 16px' }}>
                <Title weight="1">Tu solicitud no fue aprobada</Title>
                <Text style={{ color: themeParams.subtitleTextColor() }}>
                    Esta vez el grupo decidió no aceptar tu solicitud. Gracias por tu interés en FurMeets y por el
                    tiempo que dedicaste.
                </Text>
            </div>
            {me?.requestChatId && (
                <div style={{ padding: '0 16px' }}>
                    <Button size="m" mode="bezeled" stretched onClick={() => navigate(`/request-chat/${me.requestChatId}`)}>
                        Ver el chat
                    </Button>
                </div>
            )}
        </Page>
    );
}
