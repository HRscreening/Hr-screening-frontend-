import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "@/axiosConfig";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore.ts";

interface LoginFormProps {
  onToggleMode: () => void;
}

export default function LoginForm({ onToggleMode }: LoginFormProps) {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    emailOrPhone: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate login fields
    if (!loginData.emailOrPhone || !loginData.password) {
      toast.error("Please fill all login fields!");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post("/auth/login", {
        email: loginData.emailOrPhone,
        password: loginData.password
      });

      // Store token
      localStorage.setItem("access_token", res.data.access_token);

      // Hydrate auth store
      const me = await axios.get("/user/get-user");

      useAuthStore.getState().setUser({
        id: me.data.user.id,
        name: me.data.user.name,
        email: me.data.user.email
      });

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof axios.AxiosError && error.response) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Login failed");
      }
    }
    finally{
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setLoginData({ emailOrPhone: "", password: "" });
    onToggleMode();
  };

  return (
    <>
      <form onSubmit={handleLoginSubmit} className="grid gap-4">
        <Input
          name="emailOrPhone"
          placeholder="Email or Mobile No."
          value={loginData.emailOrPhone}
          onChange={handleLoginChange}
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={loginData.password}
          onChange={handleLoginChange}
        />
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-hover-primary transition cursor-pointer"
        disabled={isLoading}
        >
          Log In
        </Button>
      </form>

      <p className="text-center pt-1">
        Don't have an account?{" "}
        <span
          className="underline text-blue-400 hover:cursor-pointer"
          onClick={handleModeSwitch}
        >
          Sign Up
        </span>
      </p>
    </>
  );
}
