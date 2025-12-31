import { Page } from "@/components/Page";
import { Snackbar, Spinner } from "@telegram-apps/telegram-ui";
import { FC, useEffect, useState } from "react";
import { InfoCircleOutline28 } from "tmaui/icons";

export const LoadingPage: FC = () => {
    const [showDelayMessage, setShowDelayMessage] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowDelayMessage(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);
    return (
        <Page back={false}>

            {showDelayMessage && (
                <Snackbar
                    onClose={() => { }}
                    before={<InfoCircleOutline28 />}
                    duration={100000}
                >
                    Usamos un servicio gratuito para alojar nuestra API, por lo que en ocasiones puede tardar un poco en responder. ¡Gracias por tu paciencia!
                </Snackbar>
            )}
            <div style={{
                flex: 1,
                height: '100dvh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Spinner size='m' />
            </div>
        </Page>
    )
}