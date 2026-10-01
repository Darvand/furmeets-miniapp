import { homePathFor } from "@/navigation/role-home";
import { MeState } from "@/state/me.slice";
import { RootState } from "@/state/store";
import { FC } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useParams } from "react-router-dom";

export type RouteAccess = (me: MeState, params: Record<string, string | undefined>) => boolean;

/**
 * Muestra la ruta solo si el rol de `GET /me` la permite; si no, lleva a la pantalla que le
 * corresponde. Es solo navegación: la API autoriza cada petición por su cuenta.
 */
export const RoleRoute: FC<{ allow: RouteAccess }> = ({ allow }) => {
    const me = useSelector((state: RootState) => state.me);
    const params = useParams();
    if (!me) {
        return null;
    }
    return allow(me, params) ? <Outlet /> : <Navigate to={homePathFor(me)} replace />;
}
