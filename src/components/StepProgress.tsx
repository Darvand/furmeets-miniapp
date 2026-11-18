import { themeParams } from "@telegram-apps/sdk-react";
import { Caption, Steps } from "@telegram-apps/telegram-ui";
import { FC } from "react";

const TOTAL_STEPS = 3;

/**
 * "Paso N de 3" del solicitante: formulario, conversación con el grupo y resultado
 * (artboards *Formulario*, *Chat · vista del solicitante* y *Aprobado*).
 */
export const StepProgress: FC<{ step: number; label: string }> = ({ step, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 16px 12px' }}>
        <Caption weight="2" style={{ color: themeParams.accentTextColor() }}>
            Paso {step} de {TOTAL_STEPS} · {label}
        </Caption>
        <Steps count={TOTAL_STEPS} progress={step} />
    </div>
);
