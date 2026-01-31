import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "@/axiosConfig";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore.ts";
// import { set } from "date-fns";

interface SignupFormProps {
  onToggleMode: () => void;
}

export default function SignupForm({ onToggleMode }: SignupFormProps) {
  const navigate = useNavigate();

  const [signupData, setSignupData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const emptyFields = Object.entries(signupData).filter(([_, val]) => !val);
    if (emptyFields.length) {
      toast.error(`Please fill all fields: ${emptyFields.map(f => f[0]).join(", ")}`);
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`/auth/signup`, {
        name: signupData.fullname,
        email: signupData.email,
        password: signupData.password,
      });

      if (res.status === 201) {
        toast.success("OTP sent to your email/phone.");
        setIsOTPSent(true);
      } else {
        toast.error(`Failed to send OTP. Error ${res.data.error}`);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      if (error instanceof axios.AxiosError && error.response) {
        toast.error(`${error.response.data.message}`);
      } else {
        toast.error("Failed to send OTP. Please try again");
      }
    }
    finally{
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    try {
      setIsLoading(true);
      if (otp.length !== 6) {
        toast.error("Please enter a valid 6-digit OTP.");
        return;
      }

      // Verify OTP
      const res = await axios.post("/auth/verify-otp", {
        email: signupData.email,
        otp
      });

      if (res.status !== 200) {
        toast.error("OTP verification failed.");
        return;
      }

      // Store JWT
      localStorage.setItem("access_token", res.data.access_token);

      // Fetch logged-in user
      const me = await axios.get("/user/get-user");

      useAuthStore.getState().setUser({
        id: me.data.user.id,
        name: me.data.user.name,
        email: me.data.user.email
      });

      toast.success("Signup successful!");

      // Cleanup UI state
      setSignupData({
        fullname: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
      setOtp("");
      setIsOTPSent(false);

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof axios.AxiosError && error.response) {
        toast.error(error.response.data.message);
      } else {
        console.error("Error verifying OTP:", error);
        toast.error("Failed to verify OTP. Please try again");
      }
    }
    finally{
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setSignupData({
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setIsOTPSent(false);
    onToggleMode();
  };

  if (isOTPSent) {
    return (
      <div className="text-green-600 text-center font-medium">
        <div>OTP Sent Successfully!</div>
        <Input
          type="number"
          placeholder="Enter OTP"
          className="mt-4 w-full"
          value={otp}
          onChange={e => setOtp(e.target.value)}
        />
        <Button
        disabled={isLoading}
          onClick={handleOTPVerification}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Verify OTP
        </Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSignupSubmit} className="grid gap-4">
        <div className="flex gap-4">
          <Input
            name="fullname"
            placeholder="Full Name"
            value={signupData.fullname}
            onChange={handleSignupChange}
          />
        </div>
        <Input
          name="email"
          placeholder="Email"
          value={signupData.email}
          onChange={handleSignupChange}
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={signupData.password}
          onChange={handleSignupChange}
        />
        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={signupData.confirmPassword}
          onChange={handleSignupChange}
        />
        <Button type="submit"
        disabled={isLoading}
        className="bg-primary text-primary-foreground hover:bg-hover-primary transition cursor-pointer">
          Sign Up
        </Button>
      </form>

      <p className="text-center pt-1">
        Already have an account?{" "}
        <span
          className="underline text-blue-400 hover:cursor-pointer"
          onClick={handleModeSwitch}
        >
          Login
        </span>
      </p>
    </>
  );
}
