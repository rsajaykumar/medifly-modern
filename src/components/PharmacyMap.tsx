/// <reference types="../types/global.d.ts" />
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Phone, Clock, Star, Search, AlertCircle, Navigation, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGeolocation } from "@/hooks/use-geolocation";
import NavigationPanel from "@/components/NavigationPanel";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom user location icon with direction indicator
const createUserLocationIcon = (heading: number | null) => {
  const rotation = heading !== null ? heading : 0;
  return new L.DivIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(${rotation}deg);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 16px solid #e11d48;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: #e11d48;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Component to update map view when navigation starts or location changes
function MapViewController({ center, zoom, shouldUpdate }: { center: [number, number]; zoom: number; shouldUpdate: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (shouldUpdate) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map, shouldUpdate]);
  
  return null;
}

export default function PharmacyMap() {
  const { latitude, longitude, loading: locationLoading, requestPermission, heading, accuracy, startTracking, stopTracking, isTracking } = useGeolocation();
  const defaultCenter: [number, number] = [latitude || 12.9716, longitude || 77.5946];
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [navigationDestination, setNavigationDestination] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const [travelMode, setTravelMode] = useState<string>("driving");
  const [isNavigating, setIsNavigating] = useState(false);
  const [shouldUpdateMapView, setShouldUpdateMapView] = useState(true);
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Auto-zoom to user location when detected (only on initial load)
  useEffect(() => {
    if (latitude && longitude && !navigationDestination) {
      setMapCenter([latitude, longitude]);
      if (mapZoom === 13) {
        setMapZoom(15);
      }
      setShouldUpdateMapView(true);
      setTimeout(() => setShouldUpdateMapView(false), 500);
    }
  }, [latitude, longitude, navigationDestination]);
  
  // Auto-start tracking when navigation begins
  useEffect(() => {
    if (isNavigating && !isTracking) {
      startTracking();
    } else if (!isNavigating && isTracking) {
      stopTracking();
    }
  }, [isNavigating, isTracking, startTracking, stopTracking]);
  
  const pharmacies = useQuery(api.pharmacies.listNearby, {
    latitude: latitude || 12.9716,
    longitude: longitude || 77.5946,
    radiusKm: 100,
    searchQuery: debouncedSearchQuery,
  });

  const hasError = pharmacies === undefined && debouncedSearchQuery.length > 0;
  const isLoading = pharmacies === undefined;

  const handleRouteUpdate = (coordinates: [number, number][], mode: string) => {
    if (coordinates && coordinates.length > 0) {
      setRouteCoordinates(coordinates);
      setTravelMode(mode);
      
      if (!isNavigating) {
        setShouldUpdateMapView(true);
        const bounds = L.latLngBounds(coordinates);
        const center = bounds.getCenter();
        setMapCenter([center.lat, center.lng]);
        setMapZoom(13);
        setTimeout(() => setShouldUpdateMapView(false), 500);
      }
    }
  };

  const startNavigation = (pharmacy: any) => {
    setNavigationDestination({
      name: pharmacy.name,
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
    });
    setIsNavigating(false);
  };

  const confirmStartNavigation = () => {
    setIsNavigating(true);
    if (routeCoordinates.length > 0) {
      setShouldUpdateMapView(true);
      const bounds = L.latLngBounds(routeCoordinates);
      const center = bounds.getCenter();
      setMapCenter([center.lat, center.lng]);
      setMapZoom(14);
      setTimeout(() => setShouldUpdateMapView(false), 100);
    }
  };

  const stopNavigation = () => {
    setNavigationDestination(null);
    setRouteCoordinates([]);
    setIsNavigating(false);
    setShouldUpdateMapView(true);
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
      setMapZoom(15);
    }
  };

  if (isLoading && !debouncedSearchQuery) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const getRouteColor = (mode: string) => {
    return "#ef4444";
  };

  return (
    <>
      {navigationDestination && latitude && longitude && (
        <NavigationPanel
          destination={navigationDestination}
          userLocation={{ latitude, longitude }}
          onClose={stopNavigation}
          onRouteUpdate={handleRouteUpdate}
          isNavigating={isNavigating}
          onStartNavigation={confirmStartNavigation}
        />
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Nearby Pharmacies & Medical Stores
            </CardTitle>
            <div className="flex items-center gap-2">
              {isTracking && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Radio className="h-3 w-3" />
                  Live Tracking
                </Badge>
              )}
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
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors" />
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
          {hasError ? (
            <div className="h-[500px] w-full flex items-center justify-center bg-muted/20">
              <div className="text-center p-8">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load Map</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  There was an error loading the pharmacy locations.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-primary hover:underline"
                >
                  Clear search and try again
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[500px] w-full relative">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                className="rounded-b-lg"
                zoomControl={!isNavigating}
              >
                <MapViewController center={mapCenter} zoom={mapZoom} shouldUpdate={shouldUpdateMapView} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                
                {/* Route polyline */}
                {routeCoordinates.length > 0 && (
                  <Polyline
                    positions={routeCoordinates}
                    pathOptions={{
                      color: getRouteColor(travelMode),
                      weight: 8,
                      opacity: 0.9,
                      dashArray: travelMode === "foot" ? "10, 10" : undefined,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  />
                )}
                
                {/* User location marker with direction indicator and accuracy circle */}
                {latitude && longitude && (
                  <>
                    <Marker
                      position={[latitude, longitude]}
                      icon={createUserLocationIcon(heading)}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-base mb-1">Your Location</h3>
                          <p className="text-sm text-muted-foreground">You are here</p>
                          {accuracy && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Accuracy: ±{Math.round(accuracy)}m
                            </p>
                          )}
                          {isTracking && (
                            <Badge variant="secondary" className="mt-2">
                              <Radio className="h-3 w-3 mr-1" />
                              Live Tracking Active
                            </Badge>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[latitude, longitude]}
                      radius={accuracy || 50}
                      pathOptions={{
                        color: '#e11d48',
                        fillColor: '#e11d48',
                        fillOpacity: 0.1,
                        weight: 2,
                      }}
                    />
                  </>
                )}

                {/* Pharmacy markers */}
                {pharmacies?.map((pharmacy) => (
                  <Marker
                    key={pharmacy._id}
                    position={[pharmacy.latitude, pharmacy.longitude]}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-base mb-2">{pharmacy.name}</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{pharmacy.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{pharmacy.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{pharmacy.openHours}</span>
                          </div>
                          {pharmacy.rating && (
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{pharmacy.rating}</span>
                            </div>
                          )}
                          {pharmacy.distance && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="text-xs text-primary font-medium">
                                {pharmacy.distance.toFixed(1)} km away
                              </span>
                            </div>
                          )}
                          <div className="mt-3 pt-2 border-t">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => startNavigation(pharmacy)}
                            >
                              <Navigation className="h-3 w-3 mr-2" />
                              Start Navigation
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}