import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plane, ArrowRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";

interface HeroSectionProps {
  isAuthenticated: boolean;
  prefersReducedMotion: boolean;
}

export function HeroSection({ isAuthenticated, prefersReducedMotion }: HeroSectionProps) {
  const navigate = useNavigate();

  const handleScroll = () => {
    try {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    } catch (err) {
      console.error("Scroll error:", err);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Floating Orbs - Only if motion is enabled */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Drone Icon */}
        <motion.div
          className="mb-8 inline-block"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center bg-primary/5"
            animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="h-16 w-16 text-primary" />
          </motion.div>
        </motion.div>

        {/* Headline */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4">
            <div className="block">Medicine</div>
            <div className="block text-primary">in Minutes</div>
          </h1>
        </motion.div>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Drone delivery to your doorstep in 10 minutes. No traffic, no stops, no waiting.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            size="lg"
            className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
          >
            Order Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
          >
            Browse Medicines
          </Button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.button
            onClick={handleScroll}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="cursor-pointer hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full p-2"
            aria-label="Scroll to content"
          >
            <ChevronDown className="h-8 w-8 text-muted-foreground" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
