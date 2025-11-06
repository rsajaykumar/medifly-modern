import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

interface CTASectionProps {
  isAuthenticated: boolean;
}

export function CTASection({ isAuthenticated }: CTASectionProps) {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-20 lg:py-24 xl:py-32 relative overflow-hidden">
      {/* Background */}
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
  );
}
