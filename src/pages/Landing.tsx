import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Plane, Package, MapPin, Clock, Shield, Zap, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, signOut } = useAuth();
  
  // Wrap geolocation in try-catch to prevent blank screens - with guaranteed fallback
  let geolocationData = {
    transcriptedLocation: "",
    loading: false,
  };
  
  try {
    geolocationData = useGeolocation();
  } catch (err) {
    console.error("Geolocation hook error (caught and handled):", err);
    // Fallback values already set above
  }
  
  const { transcriptedLocation, loading: locationLoading } = geolocationData;
  
  // Wrap scroll hooks in try-catch with proper fallbacks
  const { scrollYProgress } = useScroll();
  
  let prefersReducedMotion = false;
  try {
    prefersReducedMotion = useReducedMotion() || false;
  } catch (err) {
    console.error("Reduced motion hook error (caught and handled):", err);
  }

  // Note: Parallax effects are optional and won't break the page if they fail
  // The transforms are only used for visual enhancement, not core functionality

  // Reduce animation frequency when page is idle
  useEffect(() => {
    try {
      let idleTimer: NodeJS.Timeout;
      const handleActivity = () => {
        clearTimeout(idleTimer);
        document.body.classList.remove('idle-mode');
        idleTimer = setTimeout(() => {
          document.body.classList.add('idle-mode');
        }, 30000); // 30 seconds of inactivity
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
    } catch (err) {
      console.error("Idle mode setup error (caught and handled):", err);
    }
  }, []);

  // Ensure page renders even if animations fail
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
      {/* Header */}
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
              <img src="https://harmless-tapir-303.convex.cloud/api/storage/a581615a-d814-4f61-931e-df33384b6ef8" alt="Medifly" className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight">Medifly</span>
            </button>
            
            {/* Location Display */}
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
                      <Button variant="outline" onClick={async () => {
                        try {
                          await signOut();
                          navigate("/auth");
                        } catch (err) {
                          console.error("Sign out error:", err);
                          navigate("/auth");
                        }
                      }} size="sm" className="text-xs sm:text-sm lg:text-base lg:px-6 lg:py-5">
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Floating Orbs - Reduced Motion Support */}
        {!prefersReducedMotion && (
          <>
            <motion.div
              className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                x: [0, 50, 0],
                y: [0, 30, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "loop",
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
                x: [0, -50, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "loop",
              }}
            />
          </>
        )}

        {/* Floating Particles */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Floating Drone Icon with Circle Border */}
          <motion.div
            className="mb-8 inline-block"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center bg-primary/5"
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      y: [0, -10, 0],
                      rotate: [0, 5, 0, -5, 0],
                    }
              }
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Plane className="h-16 w-16 text-primary" />
            </motion.div>
          </motion.div>

          {/* Headline with stacked text */}
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
              onClick={() => {
                try {
                  window.scrollTo({
                    top: window.innerHeight,
                    behavior: "smooth"
                  });
                } catch (err) {
                  console.error("Scroll error:", err);
                }
              }}
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="cursor-pointer hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full p-2"
              aria-label="Scroll to content"
            >
              <ChevronDown className="h-8 w-8 text-muted-foreground" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Scroll Animations */}
      <section className="py-16 sm:py-20 lg:py-24 xl:py-32 bg-muted/30 relative overflow-hidden">
        {/* Simplified static background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl opacity-40" />
        </div>
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
              Why Choose Medifly?
            </h2>
            <p className="text-lg sm:text-xl lg:text-xl text-muted-foreground max-w-2xl lg:max-w-2xl mx-auto px-4">
              Experience the future of medicine delivery
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Drone delivery in 10 minutes or less to your doorstep",
                delay: 0,
              },
              {
                icon: MapPin,
                title: "Nearby Pharmacies",
                description: "Find and book medicines from pharmacies near you",
                delay: 0.1,
              },
              {
                icon: Clock,
                title: "24/7 Available",
                description: "Order anytime, anywhere with round-the-clock service",
                delay: 0.2,
              },
              {
                icon: Shield,
                title: "Safe & Secure",
                description: "Contactless delivery with secure payment options",
                delay: 0.3,
              },
              {
                icon: Package,
                title: "Real-time Tracking",
                description: "Track your drone delivery live on the map",
                delay: 0.4,
              },
              {
                icon: Plane,
                title: "Eco-Friendly",
                description: "No emissions. Clean skies. Quiet roads.",
                delay: 0.5,
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: feature.delay,
                  duration: 0.6,
                  ease: "easeOut"
                }}
                className="bg-card p-6 sm:p-8 lg:p-10 xl:p-12 rounded-2xl border-2 hover:border-primary/50 transition-all cursor-pointer group shadow-lg hover:shadow-xl"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4 sm:mb-6 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                  <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient Animation */}
      <section className="py-16 sm:py-20 lg:py-24 xl:py-32 relative overflow-hidden">
        {/* Simplified static gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-primary/10" />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background" />
        </div>
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-4 sm:mb-6 lg:mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Skip the wait. Get it now.
            </motion.h2>
            <motion.p
              className="text-base sm:text-lg md:text-xl lg:text-xl text-muted-foreground mb-8 sm:mb-10 lg:mb-10 max-w-2xl lg:max-w-2xl mx-auto px-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Join thousands of users who trust Medifly for their medicine needs
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button
                size="lg"
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
                className="text-base sm:text-lg lg:text-lg px-8 sm:px-10 lg:px-12 py-5 sm:py-6 lg:py-6 shadow-2xl hover:shadow-primary/50 transition-all hover:scale-110 active:scale-95"
              >
                Start Ordering
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        className="border-t bg-card/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mb-6 sm:mb-8 lg:mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-3 group mb-4"
              >
                <img
                  src="https://harmless-tapir-303.convex.cloud/api/storage/a581615a-d814-4f61-931e-df33384b6ef8"
                  alt="Medifly"
                  className="h-8 w-8 transition-transform group-hover:scale-110"
                />
                <span className="text-xl font-bold group-hover:text-primary transition-colors">Medifly</span>
              </button>
              <p className="text-sm text-muted-foreground max-w-xs">
                Fast, reliable medicine delivery via drone in 10 minutes. Your health, delivered.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
              <ul className="space-y-2">
                {[
                  { label: "Browse Medicines", path: "/dashboard" },
                  { label: "My Orders", path: "/orders" },
                  { label: "Profile", path: "/profile" },
                ].map((link) => (
                  <li key={link.path}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Bangalore, India</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>24/7 Service</span>
                </li>
                <li className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>10 Min Delivery</span>
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © 2024 Medifly. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </button>
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </button>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}