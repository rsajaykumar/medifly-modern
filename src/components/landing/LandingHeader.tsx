import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNavigate } from "react-router";

interface LandingHeaderProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  transcriptedLocation: string;
  locationLoading: boolean;
  signOut: () => Promise<void>;
}

export function LandingHeader({
  isAuthenticated,
  isLoading,
  transcriptedLocation,
  locationLoading,
  signOut,
}: LandingHeaderProps) {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="https://harmless-tapir-303.convex.cloud/api/storage/a581615a-d814-4f61-931e-df33384b6ef8"
              alt="Medifly"
              className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10"
            />
            <span className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight">Medifly</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            {!locationLoading && transcriptedLocation && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{transcriptedLocation}</span>
              </div>
            )}
            <ThemeToggle />
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Button variant="ghost" onClick={() => navigate("/search")} className="hidden md:inline-flex text-sm lg:text-base">
                      Browse
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("/orders")} className="hidden md:inline-flex text-sm lg:text-base">
                      Orders
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("/nearby-stores")} className="hidden lg:inline-flex text-sm lg:text-base">
                      Nearby Stores
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("/profile")} className="hidden sm:inline-flex text-sm lg:text-base">
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await signOut();
                          navigate("/auth");
                        } catch (err) {
                          console.error("Sign out error:", err);
                          navigate("/auth");
                        }
                      }}
                      size="sm"
                      className="text-xs sm:text-sm lg:text-base lg:px-6 lg:py-5"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => navigate("/auth")} size="sm" className="text-xs sm:text-sm lg:text-base lg:px-6 lg:py-5">
                    Get Started
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
