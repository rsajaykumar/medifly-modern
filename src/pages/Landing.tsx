import { useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const { transcriptedLocation, loading: locationLoading } = useGeolocation();
  const prefersReducedMotion = useReducedMotion();

  // Idle mode detection with error handling
  useEffect(() => {
    try {
      let idleTimer: NodeJS.Timeout;
      const handleActivity = () => {
        clearTimeout(idleTimer);
        document.body.classList.remove('idle-mode');
        idleTimer = setTimeout(() => {
          document.body.classList.add('idle-mode');
        }, 30000);
      };

      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('scroll', handleActivity);
      window.addEventListener('keydown', handleActivity);

      return () => {
        clearTimeout(idleTimer);
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        window.removeEventListener('keydown', handleActivity);
      };
    } catch (error) {
      console.error("Idle mode detection error:", error);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <LandingHeader
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        transcriptedLocation={transcriptedLocation || ""}
        locationLoading={locationLoading}
        signOut={signOut}
      />
      <HeroSection isAuthenticated={isAuthenticated} prefersReducedMotion={prefersReducedMotion === true} />
      <FeaturesSection />
      <CTASection isAuthenticated={isAuthenticated} />
      <LandingFooter />
    </div>
  );
}