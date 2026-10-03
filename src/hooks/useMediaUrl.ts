import { useEffect, useState } from "react";
import { cachedMediaUrl, loadMediaUrl } from "@/services/media";

/**
 * Blob URL de una imagen de `GET /media/:id`, o `undefined` mientras carga, si falla o si
 * no hay id. Si ya se descargó antes, está disponible desde el primer render.
 */
export function useMediaUrl(mediaId: string | undefined): string | undefined {
    const [url, setUrl] = useState(() => (mediaId ? cachedMediaUrl(mediaId) : undefined));

    useEffect(() => {
        if (!mediaId) {
            setUrl(undefined);
            return;
        }
        let active = true;
        setUrl(cachedMediaUrl(mediaId));
        void loadMediaUrl(mediaId).then((loaded) => {
            if (active) {
                setUrl(loaded);
            }
        });
        return () => {
            active = false;
        };
    }, [mediaId]);

    return url;
}
