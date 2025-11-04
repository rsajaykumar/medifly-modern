import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { Plane, Shield, Clock, Heart, ArrowRight, ChevronDown } from "lucide-react";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Plane,
      title: "Medical Air Transport",
      description: "Specialized aircraft equipped with advanced medical equipment for safe patient transport",
    },
    {
      icon: Shield,
      title: "Certified Medical Staff",
      description: "Experienced medical professionals accompany every flight to ensure patient safety",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Emergency medical flights available around the clock for urgent situations",
    },
    {
      icon: Heart,
      title: "Compassionate Care",
      description: "Dedicated to providing comfort and care during critical medical transport",
    },
  ];

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features-section");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src="/logo.svg" alt="Medifly" className="h-8 w-8" />
              <span className="text-xl font-semibold">Medifly</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Button onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Medical Air Transport
              <br />
              <span className="text-muted-foreground">When Every Second Counts</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Professional medical flight services connecting patients to critical care facilities worldwide
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate(isAuthenticated ? "/search" : "/auth")}
                className="text-lg px-8"
              >
                Book a Flight
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-lg px-8"
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll Down Arrow */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <button
            onClick={scrollToFeatures}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
            aria-label="Scroll to features section"
          >
            <span className="text-sm">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-6 w-6 group-hover:text-primary transition-colors" />
            </motion.div>
          </button>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 bg-muted/50 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Why Choose Medifly
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trusted by healthcare providers and families for critical medical transport
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-background p-8 rounded-lg border"
              >
                <feature.icon className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-primary text-primary-foreground rounded-2xl p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Ready to Book Your Medical Flight?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Our team is available 24/7 to assist with your medical transport needs
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(isAuthenticated ? "/search" : "/auth")}
              className="text-lg px-8"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Medifly" className="h-6 w-6" />
              <span className="font-semibold">Medifly</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Medifly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}