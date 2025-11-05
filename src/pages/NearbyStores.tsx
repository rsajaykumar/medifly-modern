import { useAuth } from "@/hooks/use-auth";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, ShoppingCart, Package, User, LogOut, MapPin, Navigation, Star, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import PharmacyMap from "@/components/PharmacyMap";
import NavigationPanel from "@/components/NavigationPanel";

export default function NearbyStores() {
  const { isLoading: authLoading, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.list);
  const { latitude, longitude, error, loading, requestPermission } = useGeolocation();
  const [navigationDestination, setNavigationDestination] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const pharmacies = useQuery(api.pharmacies.listNearby, {
    latitude: latitude || 12.9716,
    longitude: longitude || 77.5946,
    radiusKm: 100,
    searchQuery: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const startNavigation = (pharmacy: any) => {
    setNavigationDestination({
      name: pharmacy.name,
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
    });
    setIsNavigating(false);
  };

  const stopNavigation = () => {
    setNavigationDestination(null);
    setIsNavigating(false);
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Panel */}
      {navigationDestination && latitude && longitude && (
        <NavigationPanel
          destination={navigationDestination}
          userLocation={{ latitude, longitude }}
          onClose={stopNavigation}
          isNavigating={isNavigating}
          onStartNavigation={handleStartNavigation}
        />
      )}
      
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
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-sm lg:text-base">
                Browse
              </Button>
              <Button variant="ghost" onClick={() => navigate("/orders")} className="text-sm lg:text-base">
                <Package className="h-4 w-4 mr-2" />
                Orders
              </Button>
              <Button variant="default" onClick={() => navigate("/nearby-stores")} className="text-sm lg:text-base">
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

            {/* Mobile menu */}
            <div className="md:hidden flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
                <Package className="h-5 w-5" />
              </Button>
              <Button variant="default" size="icon" onClick={() => navigate("/nearby-stores")}>
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
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
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
              Nearby Medical Stores
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Find pharmacies near you - sorted by distance
            </p>
          </div>

          {/* Location Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Your Location
              </CardTitle>
              <CardDescription>
                {loading ? "Detecting your location..." :
                  latitude && longitude ? `Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}` :
                 "Location access required to show nearby stores"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!latitude && !longitude && !loading && (
                <Button onClick={requestPermission} className="w-full sm:w-auto">
                  <MapPin className="h-4 w-4 mr-2" />
                  Enable Location Access
                </Button>
              )}
              {error && (
                <p className="text-sm text-muted-foreground">
                  Using default location. Enable GPS for accurate results.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Map and List View */}
          <Tabs value={navigationDestination ? "map" : undefined} defaultValue="map" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="list">List View (Nearest First)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="map">
              <PharmacyMap />
            </TabsContent>
            
            <TabsContent value="list">
              {!pharmacies ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pharmacies.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold mb-2">No pharmacies found</h2>
                    <p className="text-muted-foreground mb-6 text-center">
                      Enable location access to find nearby medical stores
                    </p>
                    {!latitude && !longitude && (
                      <Button onClick={requestPermission}>
                        <MapPin className="h-4 w-4 mr-2" />
                        Enable Location
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Showing {pharmacies.length} {pharmacies.length === 1 ? 'pharmacy' : 'pharmacies'} sorted by distance
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pharmacies.map((pharmacy, index) => (
                      <motion.div
                        key={pharmacy._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <CardTitle className="text-lg">{pharmacy.name}</CardTitle>
                                  {index === 0 && (
                                    <Badge className="bg-primary text-primary-foreground">Nearest</Badge>
                                  )}
                                </div>
                                <CardDescription className="mt-2">
                                  {pharmacy.address}
                                </CardDescription>
                                {pharmacy.rating && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-medium">{pharmacy.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {pharmacy.distance && (
                                  <Badge variant="secondary" className="text-base font-bold">
                                    {pharmacy.distance.toFixed(1)} km
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>{pharmacy.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{pharmacy.openHours}</span>
                                </div>
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => startNavigation(pharmacy)}
                              >
                                <Navigation className="h-4 w-4 mr-2" />
                                Start Navigation
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}