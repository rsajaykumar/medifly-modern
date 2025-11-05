import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Navigation, Clock, MapPin, Car, Bike, Footprints, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
}

interface NavigationPanelProps {
  destination: {
    name: string;
    latitude: number;
    longitude: number;
  };
  userLocation: {
    latitude: number;
    longitude: number;
  };
  onClose: () => void;
  onRouteUpdate?: (coordinates: [number, number][], mode: string) => void;
  isNavigating: boolean;
  onStartNavigation: () => void;
}

type TravelMode = "driving" | "cycling" | "foot";

export default function NavigationPanel({
  destination,
  userLocation,
  onClose,
  onRouteUpdate,
  isNavigating,
  onStartNavigation
}: NavigationPanelProps) {
  const [steps, setSteps] = useState<NavigationStep[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (destination && userLocation) {
      fetchRoute();
    }
  }, [destination?.latitude, destination?.longitude, userLocation?.latitude, userLocation?.longitude, travelMode]);

  const fetchRoute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${travelMode}/${userLocation.longitude},${userLocation.latitude};${destination.longitude},${destination.latitude}?steps=true&overview=full&geometries=geojson`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch route");
      }

      const data = await response.json();
      
      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new Error("No route found");
      }

      const route = data.routes[0];
      setTotalDistance(route.distance);
      setTotalDuration(route.duration);

      const instructions: NavigationStep[] = [];
      route.legs.forEach((leg: any) => {
        leg.steps.forEach((step: any) => {
          if (step.maneuver && step.maneuver.instruction) {
            instructions.push({
              instruction: step.maneuver.instruction,
              distance: step.distance,
              duration: step.duration,
            });
          }
        });
      });

      setSteps(instructions);
      setCurrentStepIndex(0);
      
      if (onRouteUpdate) {
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        onRouteUpdate(coordinates, travelMode);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to load navigation");
      setLoading(false);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getModeColor = (mode: TravelMode) => {
    switch (mode) {
      case "driving": return "text-blue-500";
      case "cycling": return "text-green-500";
      case "foot": return "text-orange-500";
      default: return "text-primary";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-4 top-20 z-[1000] w-80 max-h-[calc(100vh-6rem)] overflow-hidden"
      >
        <Card className="shadow-2xl border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  {isNavigating ? "Navigating" : "Route Preview"}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  To {destination.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {!isNavigating && (
              <Tabs value={travelMode} onValueChange={(value) => setTravelMode(value as TravelMode)} className="mt-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="driving" className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    <span className="hidden sm:inline">Car</span>
                  </TabsTrigger>
                  <TabsTrigger value="cycling" className="flex items-center gap-1">
                    <Bike className="h-3 w-3" />
                    <span className="hidden sm:inline">Bike</span>
                  </TabsTrigger>
                  <TabsTrigger value="foot" className="flex items-center gap-1">
                    <Footprints className="h-3 w-3" />
                    <span className="hidden sm:inline">Walk</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            
            {!loading && !error && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                <div className="flex items-center gap-1.5">
                  <MapPin className={`h-4 w-4 ${getModeColor(travelMode)}`} />
                  <span className="text-sm font-semibold">{formatDistance(totalDistance)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className={`h-4 w-4 ${getModeColor(travelMode)}`} />
                  <span className="text-sm font-semibold">{formatDuration(totalDuration)}</span>
                </div>
              </div>
            )}

            {!isNavigating && !loading && !error && (
              <Button
                onClick={onStartNavigation}
                className="w-full mt-3"
                size="lg"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Start Navigation
              </Button>
            )}
          </CardHeader>
          
          <CardContent className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Calculating route...</p>
              </div>
            )}
            
            {error && (
              <div className="text-center py-8">
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button onClick={fetchRoute} size="sm" variant="outline">
                  Retry
                </Button>
              </div>
            )}
            
            {!loading && !error && steps.length > 0 && (
              <div className="space-y-3">
                {isNavigating && (
                  <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary mb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        {currentStepIndex + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold mb-1">
                          {steps[currentStepIndex].instruction}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistance(steps[currentStepIndex].distance)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {isNavigating ? "Upcoming Steps" : "Route Overview"}
                </div>
                
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 p-3 rounded-lg transition-colors ${
                      isNavigating && index === currentStepIndex
                        ? "bg-primary/5 border-2 border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ${getModeColor(travelMode)} font-semibold text-sm`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug mb-1">
                        {step.instruction}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistance(step.distance)} • {formatDuration(step.duration)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}