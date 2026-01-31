import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

function RequireAuth() {
  const { user, loading } = useAuthStore();

  if (loading) return null; // or spinner

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
export default RequireAuth;