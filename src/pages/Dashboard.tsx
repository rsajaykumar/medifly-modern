import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2, ShoppingCart, Package, User, LogOut, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import MedicineGrid from "@/components/MedicineGrid";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.list);
  const { transcriptedLocation, loading: locationLoading } = useGeolocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b bg-card sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <img src="/logo.svg" alt="Medifly" className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight">Medifly</span>
            </div>

            {/* Location Display */}
            {transcriptedLocation && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{transcriptedLocation}</span>
              </div>
            )}

            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-sm lg:text-base">
                Browse
              </Button>
              <Button variant="ghost" onClick={() => navigate("/orders")} className="text-sm lg:text-base">
                <Package className="h-4 w-4 mr-2" />
                Orders
              </Button>
              <Button variant="ghost" onClick={() => navigate("/nearby-stores")} className="text-sm lg:text-base">
                <MapPin className="h-4 w-4 mr-2" />
                Nearby Stores
              </Button>
              <Button
                variant="ghost"
                className="relative text-sm lg:text-base"
                onClick={() => navigate("/cart")}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cartCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground shadow-lg border-2 border-background">
                      {cartCount}
                    </Badge>
                  </motion.div>
                )}
              </Button>
              <Button variant="ghost" onClick={() => navigate("/profile")} className="text-sm lg:text-base">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Sign Out</span>
              </Button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/orders")}
              >
                <Package className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/nearby-stores")}
              >
                <MapPin className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate("/cart")}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground shadow-lg border-2 border-background">
                      {cartCount}
                    </Badge>
                  </motion.div>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Welcome back, {user?.name || "User"}
            </h1>
            <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
              <p>Browse medicines and get them delivered via drone or pickup from nearby pharmacies</p>
              {locationLoading && (
                <span className="flex items-center gap-1 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Detecting location...
                </span>
              )}
            </div>
          </div>

          {/* Medicines Grid */}
          <MedicineGrid />
        </motion.div>
      </main>
    </div>
  );
}