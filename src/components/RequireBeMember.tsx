import { RootState } from "@/state/store"
import { FC, PropsWithChildren } from "react";
import { useSelector } from "react-redux"
import { Navigate, Outlet } from "react-router-dom";

export const RequireBeMember: FC<PropsWithChildren> = () => {
    const user = useSelector((state: RootState) => state.user);
    const group = useSelector((state: RootState) => state.hub.group);
    const requestChats = useSelector((state: RootState) => state.hub.requestChats);
    if (user && group && group.members.some(m => m.uuid === user.uuid)) {
        return <Outlet />;
    }

    if (user && requestChats.length > 0) {
        const nonMemberRequestChat = requestChats.find(rc => rc.requester.uuid === user.uuid);
        if (nonMemberRequestChat) {
            return <Navigate to={`/request-chat/${nonMemberRequestChat.uuid}`} replace />
        }
    }

    return <Navigate to="/register" replace />;
}