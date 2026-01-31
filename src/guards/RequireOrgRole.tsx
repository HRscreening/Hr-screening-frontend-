import { Navigate, Outlet } from "react-router-dom";
import { useContextStore } from "@/store/contextStore";



function RequireOrgRole({ roles }: { roles: string[] }) {
  const context = useContextStore((s) => s.context);

  if (context.type !== "org") return <Navigate to="/dashboard" replace />;

  if (!roles.includes(context.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}


export default RequireOrgRole;