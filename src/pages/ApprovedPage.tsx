import { Page } from "@/components/Page";
import { RootState } from "@/state/store";
import { Button, Placeholder } from "@telegram-apps/telegram-ui";
import { FC } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

/** Solicitud aprobada (versión mínima; la pantalla completa es T26). */
export const ApprovedPage: FC = () => {
    const me = useSelector((state: RootState) => state.me);
    const navigate = useNavigate();
    return (
        <Page back={false}>
            <Placeholder
                header="¡Tu solicitud fue aprobada!"
                description="El bot te envió por mensaje privado tu enlace para unirte al grupo."
                action={me?.requestChatId && (
                    <Button size="m" mode="bezeled" onClick={() => navigate(`/request-chat/${me.requestChatId}`)}>
                        Ver el chat
                    </Button>
                )}
            />
        </Page>
    );
}
