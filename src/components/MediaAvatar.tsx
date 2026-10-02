import { Avatar } from "@telegram-apps/telegram-ui";
import { ComponentProps, FC } from "react";
import { useMediaUrl } from "@/hooks/useMediaUrl";

type MediaAvatarProps = Omit<ComponentProps<typeof Avatar>, 'src'> & {
    /** Id de la imagen en la API (`avatarMediaId`, `photoMediaId`). */
    mediaId?: string;
};

/** Avatar servido por `GET /media/:id`. Mientras carga, o si no hay foto, muestra `acronym`. */
export const MediaAvatar: FC<MediaAvatarProps> = ({ mediaId, ...props }) => {
    const src = useMediaUrl(mediaId);
    return <Avatar {...props} src={src} />;
};
