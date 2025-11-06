import { motion } from "framer-motion";
import { Zap, MapPin, Clock, Shield, Package, Plane, LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  delay: number;
}

const features: Feature[] = [
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
];

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 xl:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background */}
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
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: feature.delay, duration: 0.6, ease: "easeOut" }}
              className="bg-card p-6 sm:p-8 lg:p-10 xl:p-12 rounded-2xl border-2 hover:border-primary/50 transition-all cursor-pointer group shadow-lg hover:shadow-xl"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4 sm:mb-6 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-2 sm:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
