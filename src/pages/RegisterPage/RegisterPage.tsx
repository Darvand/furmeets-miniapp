import { MediaAvatar } from "@/components/MediaAvatar";
import { Page } from "@/components/Page";
import { StepProgress } from "@/components/StepProgress";
import { initials } from "@/helpers/text";
import { ApplicationPayload } from "@/models/application.model";
import { meApi } from "@/services/me.service";
import { useSubmitApplicationMutation } from "@/services/request-chat.service";
import { AppDispatch, RootState } from "@/state/store";
import { requestWriteAccess, themeParams } from "@telegram-apps/sdk-react";
import { Button, Caption, Input, Section, Text, Textarea } from "@telegram-apps/telegram-ui";
import { FC, ReactNode, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ImagePicker, ImagePickerValue } from "./ImagePicker";

/** Los mismos topes que valida la API (`CreateApplicationDto`). */
const SHORT_TEXT = 100;
const LONG_TEXT = 2000;
const MAX_AGE = 120;

type TextField = Exclude<keyof ApplicationPayload, 'imageIds' | 'age'>;

/** Etiqueta propia: el `header` de telegram-ui no se muestra en iOS. */
const Field: FC<{ id: string; label: string; children: ReactNode }> = ({ id, label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 0' }}>
        <label htmlFor={id} style={{ padding: '0 22px' }}>
            <Caption style={{ color: themeParams.subtitleTextColor() }}>{label}</Caption>
        </label>
        {children}
    </div>
);

/** Si Telegram lo permite, pide que el bot pueda escribirle. Si lo rechaza, sigue igual. */
async function askWriteAccess(): Promise<void> {
    if (!requestWriteAccess.isAvailable()) {
        return;
    }
    try {
        await requestWriteAccess();
    } catch {
        // Sin permiso: el bot no le avisará por privado, pero la solicitud sigue.
    }
}

function parseAge(value: string): number | undefined {
    const age = Number(value);
    return value.trim() && Number.isInteger(age) && age > 0 && age <= MAX_AGE ? age : undefined;
}

/** Formulario de solicitud, paso 1 de 3 (SPEC §3.1). El envío es definitivo. */
export const RegisterPage: FC = () => {
    const user = useSelector((state: RootState) => state.user);
    const group = useSelector((state: RootState) => state.hub.group);
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const [submitApplication, { isLoading }] = useSubmitApplicationMutation();

    const [texts, setTexts] = useState<Partial<Record<TextField, string>>>({});
    const [ageText, setAgeText] = useState('');
    const [images, setImages] = useState<ImagePickerValue>({ imageIds: [], uploading: false });
    const [submitError, setSubmitError] = useState<string>();
    const onImagesChange = useCallback((value: ImagePickerValue) => setImages(value), []);

    const age = parseAge(ageText);
    const city = texts.city?.trim();
    const missing = [!age && 'tu edad', !city && 'tu ciudad'].filter(Boolean);
    const canSubmit = missing.length === 0 && !images.uploading && !isLoading;

    const text = (field: TextField) => ({
        id: `f-${field}`,
        value: texts[field] ?? '',
        onChange: (e: { target: { value: string } }) => setTexts((current) => ({ ...current, [field]: e.target.value })),
    });

    const handleSubmit = async () => {
        if (!age || !city) {
            return;
        }
        setSubmitError(undefined);
        await askWriteAccess();
        const payload: ApplicationPayload = { age, city };
        if (images.imageIds.length) {
            payload.imageIds = images.imageIds;
        }
        for (const [field, value] of Object.entries(texts) as [TextField, string][]) {
            if (field !== 'city' && value.trim()) {
                payload[field] = value.trim();
            }
        }
        try {
            // El servicio la registra como propia (`me.requestChatId`) y guarda el chat.
            const requestChat = await submitApplication(payload).unwrap();
            navigate(`/request-chat/${requestChat.uuid}`, { replace: true });
        } catch (error) {
            if ((error as { status?: unknown }).status === 409) {
                // Ya tiene una: `GET /me` lo lleva a su pantalla.
                setSubmitError('Ya tienes una solicitud enviada.');
                void dispatch(meApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }));
                return;
            }
            setSubmitError('No se pudo enviar la solicitud. Revisa tu conexión e intenta de nuevo.');
        }
    };

    return (
        <Page back={true}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px 0' }}>
                <MediaAvatar size={28} mediaId={group?.photoMediaId} acronym={initials(group?.name ?? 'FurMeets')} />
                <Text weight="2" style={{ flexGrow: 1 }}>{group?.name ?? 'FurMeets'}</Text>
                {user?.username && <Caption style={{ color: themeParams.subtitleTextColor() }}>@{user.username}</Caption>}
            </div>
            <StepProgress step={1} label="formulario" />

            <Section>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px' }}>
                    <Text weight="2" style={{ fontSize: '17px' }}>Cuéntanos quién eres</Text>
                    <Text style={{ color: themeParams.subtitleTextColor(), fontSize: '14px', lineHeight: '20px' }}>
                        Con esto el grupo te conoce antes de abrirte un chat. Solo tu edad y tu ciudad son obligatorias.
                    </Text>
                </div>
            </Section>

            <Section header="Tu fursona">
                <ImagePicker onChange={onImagesChange} />
                <Field id="f-fursonaName" label="Nombre de tu fursona">
                    <Input {...text('fursonaName')} placeholder="Dky" maxLength={SHORT_TEXT} />
                </Field>
                <Field id="f-species" label="Especie">
                    <Input {...text('species')} placeholder="Zorro ártico" maxLength={SHORT_TEXT} />
                </Field>
            </Section>

            <Section header="Sobre ti">
                <Field id="f-age" label="Edad">
                    <Input id="f-age" type="number" inputMode="numeric" min={1} max={MAX_AGE} placeholder="22"
                        value={ageText} onChange={(e) => setAgeText(e.target.value)}
                        status={ageText && !age ? 'error' : 'default'} />
                </Field>
                <Field id="f-city" label="Ciudad">
                    <Input {...text('city')} placeholder="Medellín" maxLength={SHORT_TEXT} />
                </Field>
                <Field id="f-socialLinks" label="Redes donde subes tu fursona">
                    <Input {...text('socialLinks')} placeholder="bsky.app/profile/…" maxLength={LONG_TEXT} />
                </Field>
            </Section>

            <Section header="Preguntas">
                <Field id="f-howDidYouFindUs" label="¿Cómo conociste FurMeets?">
                    <Textarea {...text('howDidYouFindUs')} placeholder="Cuéntanos quién te habló del grupo" maxLength={LONG_TEXT} />
                </Field>
                <Field id="f-knowsSomeone" label="¿Conoces a alguien del grupo?">
                    <Input {...text('knowsSomeone')} placeholder="@usuario, o déjalo vacío" maxLength={SHORT_TEXT} />
                </Field>
                <Field id="f-previousMeets" label="¿Has ido a algún meet antes?">
                    <Textarea {...text('previousMeets')} placeholder="Cuál, cuándo y con quién" maxLength={LONG_TEXT} />
                </Field>
            </Section>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0 24px' }}>
                <div style={{ padding: '4px 16px 0' }}>
                    <Button size="l" stretched loading={isLoading} disabled={!canSubmit} onClick={() => void handleSubmit()}>
                        Enviar solicitud
                    </Button>
                </div>
                <Caption role={submitError ? 'alert' : undefined} style={{
                    textAlign: 'center', padding: '0 16px',
                    color: submitError ? themeParams.destructiveTextColor() : themeParams.subtitleTextColor(),
                }}>
                    {submitError
                        ?? (missing.length ? `Falta ${missing.join(' y ')}.` : null)
                        ?? (images.uploading ? 'Esperando a que terminen de subir las imágenes…' : null)
                        ?? 'Después te abrimos un chat con los miembros del grupo.'}
                </Caption>
            </div>
        </Page>
    );
}
