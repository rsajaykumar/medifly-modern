/// <reference types="../types/global.d.ts" />
import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Navigation, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGeolocation } from "@/hooks/use-geolocation";

interface Marker {
  marker: any;
  pharmacyId: string;
}

export default function PharmacyMap() {
  const { latitude, longitude, loading: locationLoading, requestPermission } = useGeolocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<Marker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const pharmacies = useQuery(api.pharmacies.listNearby, {
    latitude: latitude || 12.9716,
    longitude: longitude || 77.5946,
    radiusKm: 100,
    searchQuery: debouncedSearchQuery,
  });

  // Initialize Google Map
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error("Google Maps API key not found");
      return;
    }

    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsMapLoaded(true);
    }
  }, []);

  // Initialize map instance
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || googleMapRef.current) return;

    const mapOptions: any = {
      center: { lat: latitude || 12.9716, lng: longitude || 77.5946 },
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    };

    googleMapRef.current = new (window as any).google.maps.Map(mapRef.current, mapOptions);
  }, [isMapLoaded, latitude, longitude]);

  // Clear all markers
  const clearMarkers = () => {
    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    markersRef.current = [];
  };

  // Update markers when pharmacies change
  useEffect(() => {
    if (!googleMapRef.current || !pharmacies || !isMapLoaded) return;

    clearMarkers();

    const bounds = new (window as any).google.maps.LatLngBounds();
    const infoWindow = new (window as any).google.maps.InfoWindow();

    pharmacies.forEach((pharmacy) => {
      const position = { lat: pharmacy.latitude, lng: pharmacy.longitude };
      
      const marker = new (window as any).google.maps.Marker({
        position,
        map: googleMapRef.current!,
        title: pharmacy.name,
        animation: (window as any).google.maps.Animation.DROP,
      });

      // Add info window
      marker.addListener("click", () => {
        const content = `
          <div style="padding: 12px; max-width: 300px;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${pharmacy.name}</h3>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
              <div style="display: flex; align-items: start; gap: 8px;">
                <span style="color: #666;">📍</span>
                <span>${pharmacy.address}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #666;">📞</span>
                <span>${pharmacy.phone}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #666;">🕐</span>
                <span>${pharmacy.openHours}</span>
              </div>
              ${pharmacy.rating ? `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #666;">⭐</span>
                  <span style="font-weight: 600;">${pharmacy.rating}</span>
                </div>
              ` : ''}
              ${pharmacy.distance ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                  <span style="color: #e11d48; font-weight: 600;">${pharmacy.distance.toFixed(1)} km away</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
        
        infoWindow.setContent(content);
        infoWindow.open(googleMapRef.current!, marker);
      });

      bounds.extend(position);
      markersRef.current.push({ marker, pharmacyId: pharmacy._id });
    });

    // Fit map to show all markers
    if (pharmacies.length > 0) {
      googleMapRef.current.fitBounds(bounds);
    }

    // Add user location marker if available
    if (latitude && longitude) {
      const userMarker = new (window as any).google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: googleMapRef.current,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#e11d48",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: "Your Location",
      });

      userMarker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="padding: 12px;">
            <h3 style="font-weight: bold; font-size: 16px;">Your Current Location</h3>
          </div>
        `);
        infoWindow.open(googleMapRef.current!, userMarker);
      });
    }
  }, [pharmacies, isMapLoaded, latitude, longitude]);

  const hasError = pharmacies === undefined && debouncedSearchQuery.length > 0;
  const isLoading = pharmacies === undefined;

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription>
              Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !debouncedSearchQuery) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Nearby Pharmacies & Medical Stores
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={requestPermission}
            disabled={locationLoading}
            className="flex items-center gap-2"
          >
            {locationLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Use My Location
              </>
            )}
          </Button>
        </div>
        <div className="relative mt-4">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors" />
          <Input
            placeholder="Search by pharmacy name, area, address, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-destructive transition-all duration-200 hover:scale-110"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        {hasError && (
          <Alert variant="destructive" className="mt-3 border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Search Error</AlertTitle>
            <AlertDescription className="text-sm">
              Unable to load pharmacy results. Please try again or clear your search.
            </AlertDescription>
          </Alert>
        )}
        {!hasError && debouncedSearchQuery && pharmacies && (
          <div className="mt-3 flex items-center gap-2">
            {pharmacies.length > 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <p className="text-sm font-semibold text-primary">
                  Found {pharmacies.length} {pharmacies.length === 1 ? 'pharmacy' : 'pharmacies'}
                </p>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No pharmacies found matching <span className="font-medium">"{debouncedSearchQuery}"</span>
                </p>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapRef}
          className="h-[500px] w-full rounded-b-lg"
          style={{ minHeight: "500px" }}
        />
      </CardContent>
    </Card>
  );
}