import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User } from "lucide-react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import SignupForm from "./SignupForm";
import LoginForm from "./LoginForm";

export default function AuthDialog() {
  const [isSignup, setIsSignUp] = useState(true);

  const toggleMode = () => {
    setIsSignUp(!isSignup);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-primary cursor-pointer text-background px-4 py-2 rounded-lg hover:bg-hover-primary transition">
          <User className="w-4 h-4 mr-2 inline" />
          Get Started
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="font-bold">{isSignup ? "Sign Up" : "Login"}</DialogTitle>
          <DialogDescription>
            {isSignup ? "Create your account to get started." : "Login to your account."}
          </DialogDescription>
        </DialogHeader>

        {isSignup ? (
          <SignupForm onToggleMode={toggleMode} />
        ) : (
          <LoginForm onToggleMode={toggleMode} />
        )}

        <p className="h-[0.5px] w-full bg-gray-300 my-2"></p>

        <div className="w-full flex flex-col gap-2 items-center justify-center">
          <Button className="w-full bg-foreground text-background border hover:bg-hover-primary transition cursor-pointer">
            <FcGoogle /> Google {isSignup ? "Sign Up" : "Login"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
