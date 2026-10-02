import { Page } from "@/components/Page";
import { RootState } from "@/state/store";
import { themeParams } from "@telegram-apps/sdk-react";
import { Blockquote, Button, Caption, Divider, Input, List, Section, Title } from "@telegram-apps/telegram-ui";
import { MediaAvatar } from "@/components/MediaAvatar";
import { FC, useState } from "react";
import { useSelector } from "react-redux";
import { Icon24Channel } from "tmaui/icons";
import { LoadingPage } from "../LoadingPage";
import { useCreateRequestChatMutation } from "@/services/request-chat.service";
import { useNavigate } from "react-router-dom";
import { initials } from "@/helpers/text";

export const RegisterPage: FC = () => {
    const user = useSelector((state: RootState) => state.user);
    const group = useSelector((state: RootState) => state.hub.group);
    const navigate = useNavigate();

    const [createRequestChat, { isLoading }] = useCreateRequestChatMutation();

    const [whereYouFoundUs, setWhereYouFoundUs] = useState('');
    const [interests, setInterests] = useState('');

    const handleSubmit = async () => {
        if (!user) return;
        // El servicio guarda la solicitud y la registra como propia (`me.requestChatId`).
        const requestChat = await createRequestChat({
            requesterUUID: user.uuid,
            whereYouFoundUs: whereYouFoundUs || undefined,
            interests: interests || undefined,
        }).unwrap();
        navigate(`/request-chat/${requestChat.uuid}`, { replace: true });
    }

    if (!user || !group) {
        return (<LoadingPage />);
    }
    return (
        <Page back={true}>
            <Section>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '32px 16px',
                    }}
                >
                    <MediaAvatar size={96} mediaId={group.photoMediaId} acronym={initials(group.name)} />
                    <Title weight="1">{group.name}</Title>
                    <Caption style={{ color: themeParams.subtitleTextColor() }}>{group.description}</Caption>
                    <Divider />
                    <Blockquote topRightIcon={<Icon24Channel />}>
                        Hola <i>{user.name}</i>. Si quieres disfrutar del ambiente de <b>FurMeets</b>, te invitamos a solicitar
                        el accesso. Los siguientes datos son opcionales y nos ayudan a conocerte mejor.
                        Luego tendrás disponible un chat por este mismo medio para comunicarte con <b>FurMeets</b>. Desde este chat,
                        los propios integrantes te daran el acceso.
                    </Blockquote>
                </div>
                <Section header="Información opcional" style={{
                    backgroundColor: 'red'
                }}>
                    <List style={{ display: 'flex', flexDirection: 'column', padding: '16px 16px' }}>
                        <Input header="¿De dónde nos conoces?" placeholder="Por facebook" value={whereYouFoundUs} onChange={e => setWhereYouFoundUs(e.target.value)} />
                        <Input header="¿Qué intereses tienes?" placeholder="Me gustan los videojuegos" value={interests} onChange={e => setInterests(e.target.value)} />
                        <Button size="s" mode="filled" onClick={() => void handleSubmit()} disabled={isLoading}>
                            Enviar solicitud
                        </Button>
                    </List>
                </Section>
            </Section>
        </Page>
    )
}