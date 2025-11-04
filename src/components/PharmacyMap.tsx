import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Loader2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PharmacyMap() {
  const { latitude, longitude, loading } = useGeolocation();
  
  const pharmacies = useQuery(api.pharmacies.listNearby, {
    latitude: latitude || 12.9716,
    longitude: longitude || 77.5946,
    radiusKm: 100,
    searchQuery: "",
  });

  if (loading || !pharmacies) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Interactive map view coming soon
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {pharmacies.length} {pharmacies.length === 1 ? 'pharmacy' : 'pharmacies'} found nearby
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
