import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, X } from "lucide-react";
import { motion } from "framer-motion";

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
  isNavigating: boolean;
  onStartNavigation: () => void;
}

export default function NavigationPanel({
  destination,
  userLocation,
  onClose,
  isNavigating,
  onStartNavigation,
}: NavigationPanelProps) {
  const calculateDistance = () => {
    const R = 6371; // Earth's radius in km
    const dLat = ((destination.latitude - userLocation.latitude) * Math.PI) / 180;
    const dLon = ((destination.longitude - userLocation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.latitude * Math.PI) / 180) *
        Math.cos((destination.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const openDirections = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(
        `maps://maps.apple.com/?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${destination.latitude},${destination.longitude}&dirflg=d`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`,
        '_blank'
      );
    }
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4"
    >
      <Card className="shadow-lg border-2 border-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Navigating to {destination.name}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Distance: <span className="font-bold text-foreground">{calculateDistance()} km</span>
          </div>
          <Button className="w-full" onClick={openDirections}>
            Open in Maps App
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
