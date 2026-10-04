/** Fotos o referencias de la fursona que admite el formulario (SPEC §3.1). */
export const MAX_FORM_IMAGES = 3;

/** `POST /applications`. Solo edad y ciudad son obligatorias. */
export interface ApplicationPayload {
    /** Ids devueltos por `POST /media`, en el orden elegido. */
    imageIds?: string[];
    fursonaName?: string;
    species?: string;
    age: number;
    city: string;
    socialLinks?: string;
    howDidYouFindUs?: string;
    knowsSomeone?: string;
    previousMeets?: string;
}

/** Formulario de una solicitud, como lo devuelve la API. */
export interface ApplicationForm extends Omit<ApplicationPayload, 'imageIds'> {
    /** Se ven con `GET /media/:id` (ver `useMediaUrl`). */
    imageIds?: string[];
    /** Edad menor de 18: la solicitud lleva la etiqueta "Menor de edad". */
    isMinor: boolean;
}

/** Respuestas del formulario anterior (solicitudes migradas). */
export interface LegacyApplication {
    howDidYouFindUs?: string;
    interests?: string;
}
