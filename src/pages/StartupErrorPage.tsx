import { Page } from "@/components/Page";
import { Button, Placeholder } from "@telegram-apps/telegram-ui";
import { FC } from "react";

/** No se pudo cargar `GET /me` (sin red, API caída o la App abierta fuera de Telegram). */
export const StartupErrorPage: FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <Page back={false}>
        <Placeholder
            header="No pudimos cargar tus datos"
            description="Revisa tu conexión y vuelve a intentarlo. Si el problema sigue, cierra y abre la MiniApp desde Telegram."
            action={<Button size="m" onClick={onRetry}>Reintentar</Button>}
        />
    </Page>
);
