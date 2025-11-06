import { motion } from "framer-motion";
import { MapPin, Clock, Plane } from "lucide-react";
import { useNavigate } from "react-router";

export function LandingFooter() {
  const navigate = useNavigate();

  return (
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
            <button onClick={() => navigate("/")} className="flex items-center gap-3 group mb-4">
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
  );
}
