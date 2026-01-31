import { type ReactNode, useEffect } from "react";
import axios from "@/axiosConfig";
import { useAuthStore } from "@/store/authStore";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading } = useAuthStore();


  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/user/get-user");

      setUser({
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email
      });

      // 
      if (location.pathname === "/login" || location.pathname === "/") {
        window.location.replace("/dashboard");
      }

    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return <>{children}</>;
}
