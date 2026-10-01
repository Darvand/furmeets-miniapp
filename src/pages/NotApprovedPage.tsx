import { Page } from "@/components/Page";
import { RootState } from "@/state/store";
import { Button, Placeholder } from "@telegram-apps/telegram-ui";
import { FC } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

/** Solicitud rechazada (versión mínima; la pantalla completa es T26). */
export const NotApprovedPage: FC = () => {
    const me = useSelector((state: RootState) => state.me);
    const navigate = useNavigate();
    return (
        <Page back={false}>
            <Placeholder
                header="Tu solicitud no fue aprobada"
                description="Gracias por tu interés en FurMeets."
                action={me?.requestChatId && (
                    <Button size="m" mode="bezeled" onClick={() => navigate(`/request-chat/${me.requestChatId}`)}>
                        Ver el chat
                    </Button>
                )}
            />
        </Page>
    );
}
