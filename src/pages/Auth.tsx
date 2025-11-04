import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, Clock, User, Phone } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"signIn" | { email: string } | "userDetails">("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpExpiryTime, setOtpExpiryTime] = useState(0);
  const [userDetails, setUserDetails] = useState({ name: "", phone: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");
  
  const updateUserDetails = useMutation(api.users.updateProfile);
  const logSignIn = useMutation(api.users.logSignIn);

  // Load saved email on mount
  useEffect(() => {
    const saved = localStorage.getItem("medifly_saved_email");
    if (saved) {
      setSavedEmail(saved);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Check if user has completed profile
      if (!user.name || !user.phone) {
        setStep("userDetails");
      } else {
        navigate(redirectAfterAuth || "/");
      }
    }
  }, [authLoading, isAuthenticated, user, navigate, redirectAfterAuth]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // OTP expiry timer (15 minutes = 900 seconds)
  useEffect(() => {
    if (otpExpiryTime > 0) {
      const timer = setTimeout(() => {
        setOtpExpiryTime(otpExpiryTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (otpExpiryTime === 0 && step !== "signIn" && step !== "userDetails") {
      setError("Your verification code has expired. Please request a new one.");
    }
  }, [otpExpiryTime, step]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("medifly_saved_email", email);
      } else {
        localStorage.removeItem("medifly_saved_email");
      }
      
      await signIn("email-otp", formData);
      setStep({ email });
      setResendCountdown(60);
      setOtpExpiryTime(900);
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (step === "signIn" || step === "userDetails" || resendCountdown > 0) return;
    
    setIsLoading(true);
    setError(null);
    setOtp("");
    
    try {
      const formData = new FormData();
      formData.append("email", step.email);
      await signIn("email-otp", formData);
      setResendCountdown(60);
      setOtpExpiryTime(900);
      setIsLoading(false);
    } catch (error) {
      console.error("OTP resend error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to resend verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (otpExpiryTime === 0) {
      setError("Your verification code has expired. Please request a new one.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      // Log sign-in event
      const userAgent = navigator.userAgent;
      const device = /Mobile|Android|iPhone/i.test(userAgent) ? "Mobile" : "Desktop";
      await logSignIn({ userAgent, device });
      toast.success("Verification successful!", {
        description: "Please complete your profile",
        duration: 2000,
      });
      // Move to user details step instead of navigating away
      setStep("userDetails");
      setIsLoading(false);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleUserDetailsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await updateUserDetails({
        name: userDetails.name,
        phone: userDetails.phone,
      });
      toast.success("Profile completed! Welcome to Medifly.", {
        description: "Redirecting to dashboard...",
        duration: 2000,
      });
      setTimeout(() => {
        navigate(redirectAfterAuth || "/");
      }, 500);
    } catch (error) {
      console.error("Profile update error:", error);
      setError("Failed to update profile. Please try again.");
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center h-full flex-col">
        <Card className="min-w-[350px] pb-0 border shadow-md">
          {step === "signIn" ? (
            <>
              <CardHeader className="text-center">
              <div className="flex justify-center">
                    <img
                      src="./logo.svg"
                      alt="Lock Icon"
                      width={64}
                      height={64}
                      className="rounded-lg mb-4 mt-4 cursor-pointer"
                      onClick={() => navigate("/")}
                    />
                  </div>
                <CardTitle className="text-xl">Get Started</CardTitle>
                <CardDescription>
                  Enter your email to receive a verification code
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        className="pl-9"
                        disabled={isLoading}
                        defaultValue={savedEmail}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      size="icon"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                      Remember my email
                    </label>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}
                </CardContent>
              </form>
            </>
          ) : step === "userDetails" ? (
            <>
              <CardHeader className="text-center mt-4">
                <CardTitle>Complete Your Profile</CardTitle>
                <CardDescription>
                  Please provide your name and phone number
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUserDetailsSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        type="text"
                        className="pl-9"
                        value={userDetails.name}
                        onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+91 98765 43210"
                        type="tel"
                        className="pl-9"
                        value={userDetails.phone}
                        onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-red-500 text-center">
                      {error}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !userDetails.name || !userDetails.phone}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete Profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="text-center mt-4">
                <CardTitle>Check your email</CardTitle>
                <CardDescription>
                  We've sent a code to {step.email}
                </CardDescription>
                {otpExpiryTime > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className={otpExpiryTime <= 60 ? "text-destructive font-medium" : "text-muted-foreground"}>
                      Code expires in {formatTime(otpExpiryTime)}
                    </span>
                  </div>
                )}
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="pb-4">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading || otpExpiryTime === 0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading && otpExpiryTime > 0) {
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) {
                            form.requestSubmit();
                          }
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500 text-center">
                      {error}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Didn't receive a code?{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto"
                      onClick={handleResendOtp}
                      disabled={resendCountdown > 0 || isLoading}
                    >
                      {resendCountdown > 0
                         ? `Resend in ${resendCountdown}s`
                         : "Resend code"}
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || otp.length !== 6 || otpExpiryTime === 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify code
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep("signIn");
                      setOtp("");
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Use different email
                  </Button>
                </CardFooter>
              </form>
            </>
          )}
          <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
            Secured by{" "}
            <a
              href="https://vly.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              vly.ai
            </a>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}