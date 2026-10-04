import { Page } from "@/components/Page";
import { RootState } from "@/state/store";
import { themeParams } from "@telegram-apps/sdk-react";
import { Button, Caption, Cell, Section, Text, Title } from "@telegram-apps/telegram-ui";
import { FC, ReactNode } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

/** Ícono de trazo en el color de acento del tema. */
const Icon: FC<{ children: ReactNode }> = ({ children }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={themeParams.accentTextColor()}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);

const FEATURES = [
    {
        title: 'Meets en persona',
        subtitle: 'Planes en la ciudad.',
        icon: <Icon><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Icon>,
    },
    {
        title: 'Artistas de la comunidad',
        subtitle: 'Para cuando quieras comisionar tu idea.',
        icon: <Icon><path d="M4 20l4-1 10-10a2.1 2.1 0 0 0-3-3L5 16l-1 4z" /><path d="M13.5 7.5l3 3" /></Icon>,
    },
    {
        title: 'Un grupo cuidado',
        subtitle: 'Cada persona nueva la recibe el grupo entero.',
        icon: <Icon><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></Icon>,
    },
];

const STEPS = ['Llenas un formulario corto', 'Charlas con el grupo', 'Te avisamos aquí'];

/** Bienvenida del solicitante sin solicitud, antes del formulario (SPEC §3.6). */
export const WelcomePage: FC = () => {
    const user = useSelector((state: RootState) => state.user);
    const navigate = useNavigate();
    return (
        <Page back={false}>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '32px 16px 16px' }}>
                    <Caption style={{ color: themeParams.subtitleTextColor() }}>Hola, {user?.name}</Caption>
                    <Title weight="1">Te estábamos esperando</Title>
                    <Text style={{ color: themeParams.subtitleTextColor() }}>
                        FurMeets es la comunidad furry más grande de Medellín: meets, artistas y gente con la
                        que da gusto hablar.
                    </Text>
                </div>
                <Section>
                    {FEATURES.map(({ title, subtitle, icon }) => (
                        <Cell key={title} before={icon} subtitle={subtitle} multiline>{title}</Cell>
                    ))}
                </Section>
                <Section header="Así funciona">
                    {STEPS.map((step, i) => (
                        <Cell key={step} before={<Text weight="2" style={{ color: themeParams.accentTextColor() }}>{i + 1}</Text>}>
                            {step}
                        </Cell>
                    ))}
                </Section>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                    <Button size="l" stretched onClick={() => navigate('/register')}>Quiero unirme</Button>
                    <Caption style={{ color: themeParams.subtitleTextColor(), textAlign: 'center' }}>Toma pocos minutos</Caption>
                </div>
            </div>
        </Page>
    );
}
