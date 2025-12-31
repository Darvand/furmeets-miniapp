import { themeParams } from "@telegram-apps/sdk-react"
import { Blockquote, Text, Accordion, List, Caption } from "@telegram-apps/telegram-ui"
import { AccordionContent } from "@telegram-apps/telegram-ui/dist/components/Blocks/Accordion/components/AccordionContent/AccordionContent"
import { AccordionSummary } from "@telegram-apps/telegram-ui/dist/components/Blocks/Accordion/components/AccordionSummary/AccordionSummary"
import { useState } from "react"

export const FAQ: React.FC = () => {
    const [expandHowRequestsWorks, setExpandHowRequestsWorks] = useState<boolean>(false);
    const [expandWhatBotCanDo, setExpandWhatBotCanDo] = useState<boolean>(false);
    return (
        <div
            style={{
                padding: '12px 0'
            }}
        >
            <Text weight='2' style={{ color: themeParams.accentTextColor(), padding: '12px 24px' }}>Preguntas Frecuentes</Text>
            <List>
                <Accordion expanded={expandHowRequestsWorks} onChange={() => setExpandHowRequestsWorks(!expandHowRequestsWorks)}>
                    <AccordionSummary style={{ margin: 0, padding: '0px 24px' }}>
                        <Caption weight="2">Solicitudes</Caption>
                    </AccordionSummary>
                    <AccordionContent>
                        <Blockquote>
                            Cualquier usuario que no haga parte del grupo puede enviar una solicitud de chat.
                            Una vez enviada, los miembros del grupo seran notificados y podran acceder a la solicitud para iniciar una conversacion privada con el solicitante.
                            Las solicitudes pueden incluir informacion adicional como "¿Donde nos encontraste?" e "Intereses".
                            Cualquiera puede votar. Pasado los umbrales establecidos, la solicitud se marcara como completada.
                        </Blockquote>
                    </AccordionContent>
                </Accordion>
                <Accordion expanded={expandWhatBotCanDo} onChange={() => setExpandWhatBotCanDo(!expandWhatBotCanDo)}>
                    <AccordionSummary style={{ margin: 0, padding: '0px 24px' }}>
                        <Caption weight="2">¿Qué más puede hacer el bot?</Caption>
                    </AccordionSummary>
                    <AccordionContent>
                        <Blockquote>
                            Hasta el momento el bot solo gestiona las solicitudes de chat para el grupo.
                        </Blockquote>
                    </AccordionContent>
                </Accordion>
            </List>
        </div>
    )
}