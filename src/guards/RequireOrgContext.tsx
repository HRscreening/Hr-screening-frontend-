import { Navigate, Outlet } from "react-router-dom";
import { useContextStore } from "@/store/contextStore";

function RequireOrgContext() {
  const context = useContextStore((s) => s.context);

  if (context.type !== "org") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default RequireOrgContext;