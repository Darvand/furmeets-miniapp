import { Page } from "@/components/Page";
import { Spinner } from "@telegram-apps/telegram-ui";
import { FC } from "react";

export const LoadingPage: FC = () => {
    return (
        <Page back={false}>
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