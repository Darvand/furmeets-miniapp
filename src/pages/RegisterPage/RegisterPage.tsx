import { Page } from "@/components/Page";
import { RootState } from "@/state/store";
import { themeParams } from "@telegram-apps/sdk-react";
import { Avatar, Blockquote, Button, Caption, Divider, Input, List, Section, Title } from "@telegram-apps/telegram-ui";
import { FC, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon24Channel } from "tmaui/icons";
import { LoadingPage } from "../LoadingPage";
import { useCreateRequestChatMutation } from "@/services/request-chat.service";
import { setRequestChat } from "@/state/request-chat.slice";
import { useNavigate } from "react-router-dom";

export const RegisterPage: FC = () => {
    const user = useSelector((state: RootState) => state.user);
    const group = useSelector((state: RootState) => state.hub.group);
    const requestChats = useSelector((state: RootState) => state.hub.requestChats);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [createRequestChat, { isLoading }] = useCreateRequestChatMutation();

    const [whereYouFoundUs, setWhereYouFoundUs] = useState('');
    const [interests, setInterests] = useState('');

    const handleSubmit = async () => {
        if (!user) return;
        const requestChat = await createRequestChat({
            requesterUUID: user.uuid,
            whereYouFoundUs: whereYouFoundUs || undefined,
            interests: interests || undefined,
        }).unwrap();
        dispatch(setRequestChat(requestChat));
        navigate(`/request-chat/${requestChat.uuid}`, { replace: true });
    }

    if (!user || !group) {
        return (<LoadingPage />);
    }
    const requestChat = useMemo(() => {
        return requestChats.find(rc => rc.requester.uuid === user.uuid);
    }, [requestChats, user]);
    useEffect(() => {
        if (requestChat) {
            navigate(`/request-chat/${requestChat.uuid}`, { replace: true });
        }
    }, [requestChat, navigate]);
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
                    <Avatar size={96} src={group.photoUrl} />
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
                        <Button size="s" mode="filled" onClick={handleSubmit} disabled={isLoading}>
                            Enviar solicitud
                        </Button>
                    </List>
                </Section>
            </Section>
        </Page>
    )
}