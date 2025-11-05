import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Loader2, ArrowLeft, MapPin, Package, Clock, X, Phone, FileText, Plane, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Animated Status Icon Component
const AnimatedStatusIcon = ({ status, label }: { status: "completed" | "active" | "pending"; label: string }) => {
  const icons = {
    "Order Placed": Package,
    "Processing": Clock,
    "In Transit": Plane,
    "Delivered": MapPin,
  };
  const Icon = icons[label as keyof typeof icons] || Package;
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`relative flex items-center justify-center w-16 h-16 rounded-full ${
          status === "completed"
            ? "bg-green-500/20 border-2 border-green-500"
            : status === "active"
            ? "bg-blue-500/20 border-2 border-blue-500"
            : "bg-gray-300/20 border-2 border-gray-300"
        }`}
        animate={
          status === "active"
            ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: status === "active" ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <Icon
          className={`w-8 h-8 ${
            status === "completed"
              ? "text-green-600"
              : status === "active"
              ? "text-blue-600"
              : "text-gray-400"
          }`}
        />
        {status === "active" && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-500"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>
      <span
        className={`text-sm font-medium ${
          status === "completed"
            ? "text-green-600"
            : status === "active"
            ? "text-blue-600"
            : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </motion.div>
  );
};

export default function OrderTracking() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const order = useQuery(
    api.orders.get,
    orderId ? { id: orderId as Id<"orders"> } : "skip"
  );
  const cancelOrder = useMutation(api.orders.cancel);
  const [isCancelling, setIsCancelling] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show toast notifications for geofence events
  useEffect(() => {
    if (order?.geofenceEvents && order.geofenceEvents.length > 0) {
      const latestEvent = order.geofenceEvents[order.geofenceEvents.length - 1];
      const eventAge = Date.now() - latestEvent.timestamp;
            
      // Only show notification if event is recent (within last 5 seconds)
      if (eventAge < 5000) {
        if (latestEvent.eventType === "entered") {
          toast.success(`🚁 Drone ${latestEvent.eventType} ${latestEvent.zone}!`, {
            description: "Your delivery is progressing smoothly",
          });
        } else {
          toast.info(`🚁 Drone ${latestEvent.eventType} ${latestEvent.zone}`, {
            description: "Continuing to your location",
          });
        }
      }
    }
  }, [order?.geofenceEvents]);

  // Re-render map when drone location changes to recenter
  useEffect(() => {
    if (order?.droneLocation) {
      setMapKey(prev => prev + 1);
    }
  }, [order?.droneLocation?.latitude, order?.droneLocation?.longitude]);

  // Fetch real-time route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      if (!order?.droneLocation || !order?.deliveryAddress) return;

      const start = `${order.droneLocation.longitude},${order.droneLocation.latitude}`;
      const end = `${order.deliveryAddress.longitude},${order.deliveryAddress.latitude}`;
      
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          );
          setRouteCoordinates(coords);
          setRouteDistance(data.routes[0].distance / 1000); // Convert to km
          setRouteDuration(data.routes[0].duration / 60); // Convert to minutes
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
      }
    };

    if (order?.status === "in_flight") {
      fetchRoute();
      const interval = setInterval(fetchRoute, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [order?.droneLocation, order?.deliveryAddress, order?.status]);

  const handleCancelOrder = async () => {
    if (!orderId) return;
        
    setIsCancelling(true);
    try {
      await cancelOrder({ orderId: orderId as Id<"orders"> });
      toast.success("Order cancelled successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading || order === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Button onClick={() => navigate("/orders")}>Back to Orders</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "picked_up":
        return "bg-green-500/10 text-green-600";
      case "in_flight":
      case "ready_for_pickup":
        return "bg-blue-500/10 text-blue-600";
      case "cancelled":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-yellow-500/10 text-yellow-600";
    }
  };

  const canCancelOrder = order && (order.status === "pending" || order.status === "confirmed");

  // Determine status for each stage
  const getStageStatus = (stage: string): "completed" | "active" | "pending" => {
    const stages = ["pending", "confirmed", "in_flight", "delivered"];
    const currentIndex = stages.indexOf(order.status);
    const stageIndex = stages.indexOf(stage);
    if (stageIndex < currentIndex) return "completed";
    if (stageIndex === currentIndex) return "active";
    return "pending";
  };

  // Calculate distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Define locations first
  const pharmacyLocation: [number, number] = [12.9716, 77.5946];
  const deliveryLocation: [number, number] = order.deliveryAddress
    ? [order.deliveryAddress.latitude, order.deliveryAddress.longitude]
    : [12.9716, 77.5946];
    
  const droneLocation: [number, number] = order.droneLocation
    ? [order.droneLocation.latitude, order.droneLocation.longitude]
    : pharmacyLocation;

  // Now calculate distances
  const totalDistance = calculateDistance(
    pharmacyLocation[0],
    pharmacyLocation[1],
    deliveryLocation[0],
    deliveryLocation[1]
  );

  const remainingDistance = calculateDistance(
    droneLocation[0],
    droneLocation[1],
    deliveryLocation[0],
    deliveryLocation[1]
  );

  const estimatedMinutes = order.status === "in_flight" ? Math.ceil(remainingDistance * 2) : 10;

  // Use real-time route data if available, otherwise calculate
  const displayDistance = routeDistance > 0 ? routeDistance : remainingDistance;
  const displayDuration = routeDuration > 0 ? Math.ceil(routeDuration) : estimatedMinutes;

  // Custom drone icon with animation
  const droneIcon = L.divIcon({
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          background: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          animation: dronePulse 2s ease-in-out infinite;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          border: 2px solid #3b82f6;
          border-radius: 50%;
          opacity: 0.3;
          animation: droneRipple 2s ease-out infinite;
        "></div>
      </div>
      <style>
        @keyframes dronePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes droneRipple {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      </style>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  const handleOpenInGoogleMaps = () => {
    if (!order?.deliveryAddress) return;
    
    const destination = `${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`;
    const origin = order.droneLocation 
      ? `${order.droneLocation.latitude},${order.droneLocation.longitude}`
      : `${pharmacyLocation[0]},${pharmacyLocation[1]}`;
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/orders")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Order #{order._id.slice(-8)}
              </h1>
              <p className="text-muted-foreground">
                Placed on {new Date(order._creationTime).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(order.status)} variant="outline">
                {order.status.replace("_", " ").toUpperCase()}
              </Badge>
              {canCancelOrder && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isCancelling}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this order? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, Cancel Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Animated Status Timeline */}
          {order.deliveryType === "drone" && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start relative">
                  <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200 z-0" style={{ width: "calc(100% - 4rem)", left: "2rem" }} />
                  <motion.div
                    className="absolute top-8 left-0 h-0.5 bg-blue-500 z-0"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        order.status === "delivered"
                          ? "calc(100% - 4rem)"
                          : order.status === "in_flight"
                          ? "calc(66% - 2.67rem)"
                          : order.status === "confirmed"
                          ? "calc(33% - 1.33rem)"
                          : "0%",
                    }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    style={{ left: "2rem" }}
                  />
                  <AnimatedStatusIcon status={getStageStatus("pending")} label="Order Placed" />
                  <AnimatedStatusIcon status={getStageStatus("confirmed")} label="Processing" />
                  <AnimatedStatusIcon status={getStageStatus("in_flight")} label="In Transit" />
                  <AnimatedStatusIcon status={getStageStatus("delivered")} label="Delivered" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Drone Tracking Map */}
            <div className="lg:col-span-2 space-y-6">
              {/* Geofence Events Alert */}
              {order.geofenceEvents && order.geofenceEvents.length > 0 && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        🚁
                      </motion.div>
                      Geofence Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {order.geofenceEvents.slice(-5).reverse().map((event, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between text-sm p-2 bg-background rounded"
                        >
                          <span className="font-medium">
                            {event.eventType === "entered" ? "✅" : "🚀"} {event.zone}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {order.deliveryType === "drone" && order.status === "in_flight" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Live Drone Tracking</span>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2 h-2 bg-blue-600 rounded-full mr-2"
                        />
                        Live
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Miniature Map with enhanced interactivity */}
                    <motion.div 
                      className="h-[400px] w-full rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow duration-300"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <MapContainer
                        key={mapKey}
                        center={droneLocation}
                        zoom={14}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={true}
                        zoomControl={true}
                        className="rounded-lg"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {/* Pharmacy Marker */}
                        <Marker position={pharmacyLocation}>
                          <Popup className="custom-popup">
                            <div className="text-center p-2">
                              <p className="font-bold text-base mb-1">🏥 Medical Store</p>
                              <p className="text-xs text-muted-foreground">Starting Point</p>
                              <p className="text-xs text-primary font-medium mt-1">Order Dispatched</p>
                            </div>
                          </Popup>
                        </Marker>
                        {/* Animated Drone Marker */}
                        <Marker position={droneLocation} icon={droneIcon}>
                          <Popup className="custom-popup">
                            <div className="text-center p-2">
                              <p className="font-bold text-base mb-2">🚁 Drone En Route</p>
                              <div className="space-y-1">
                                <p className="text-xs">
                                  <span className="font-semibold text-primary">Distance:</span> {displayDistance.toFixed(2)} km
                                </p>
                                <p className="text-xs">
                                  <span className="font-semibold text-blue-600">Speed:</span> {order.droneLocation?.speed?.toFixed(0) || 0} km/h
                                </p>
                                <p className="text-xs">
                                  <span className="font-semibold text-green-600">Altitude:</span> {order.droneLocation?.altitude?.toFixed(0) || 0}m
                                </p>
                                <p className="text-xs font-medium text-primary mt-2">
                                  ETA: {displayDuration} min
                                </p>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                        {/* Delivery Location Marker */}
                        <Marker position={deliveryLocation}>
                          <Popup className="custom-popup">
                            <div className="text-center p-2">
                              <p className="font-bold text-base mb-1">📍 Your Location</p>
                              <p className="text-xs text-muted-foreground">Delivery Destination</p>
                              <p className="text-xs text-green-600 font-medium mt-1">
                                Arriving in ~{displayDuration} min
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                        {/* Real-time Route Line from OSRM */}
                        {routeCoordinates.length > 0 ? (
                          <Polyline
                            positions={routeCoordinates}
                            color="#3b82f6"
                            weight={4}
                            opacity={0.8}
                            dashArray="10, 10"
                            className="animate-pulse"
                          />
                        ) : (
                          <Polyline
                            positions={[pharmacyLocation, droneLocation, deliveryLocation]}
                            color="#3b82f6"
                            weight={4}
                            opacity={0.8}
                            dashArray="10, 10"
                            className="animate-pulse"
                          />
                        )}
                        {/* Completed path segment */}
                        <Polyline
                          positions={[pharmacyLocation, droneLocation]}
                          color="#10b981"
                          weight={3}
                          opacity={0.6}
                        />
                      </MapContainer>
                    </motion.div>

                    {/* Distance and ETA Info with Google Maps button */}
                    <div className="grid grid-cols-3 gap-4">
                      <motion.div 
                        className="p-4 bg-muted rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Distance</span>
                        </div>
                        <p className="text-2xl font-bold">{displayDistance.toFixed(2)} km</p>
                        <p className="text-xs text-muted-foreground">
                          {routeDistance > 0 ? "Real-time route" : "Direct distance"}
                        </p>
                      </motion.div>
                      <motion.div 
                        className="p-4 bg-muted rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">ETA</span>
                        </div>
                        <p className="text-2xl font-bold">{displayDuration} min</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(Date.now() + displayDuration * 60000).toLocaleTimeString()}
                        </p>
                      </motion.div>
                      <motion.div 
                        className="p-4 bg-primary/10 rounded-lg cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        onClick={handleOpenInGoogleMaps}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Navigation className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Navigate</span>
                        </div>
                        <p className="text-sm font-bold text-primary">Open in</p>
                        <p className="text-xs text-muted-foreground">Google Maps</p>
                      </motion.div>
                    </div>

                    {/* Drone Status Indicators */}
                    {order.droneLocation && (
                      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Plane className="h-5 w-5 text-primary" />
                            Drone Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-3">
                            <motion.div 
                              className="text-center p-3 bg-background rounded-lg"
                              whileHover={{ y: -2 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <p className="text-xs text-muted-foreground mb-1">Altitude</p>
                              <p className="text-lg font-bold text-primary">
                                {order.droneLocation.altitude?.toFixed(0) || 0}m
                              </p>
                            </motion.div>
                            <motion.div 
                              className="text-center p-3 bg-background rounded-lg"
                              whileHover={{ y: -2 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <p className="text-xs text-muted-foreground mb-1">Speed</p>
                              <p className="text-lg font-bold text-primary">
                                {order.droneLocation.speed?.toFixed(0) || 0} km/h
                              </p>
                            </motion.div>
                            <motion.div 
                              className="text-center p-3 bg-background rounded-lg"
                              whileHover={{ y: -2 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <p className="text-xs text-muted-foreground mb-1">Battery</p>
                              <p className="text-lg font-bold text-green-600">
                                {Math.max(75, 100 - Math.floor(displayDistance * 5))}%
                              </p>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          toast.info("Order details displayed above");
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Order Details
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          toast.success("Support team will contact you shortly");
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.medicineName}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="font-bold">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {order.deliveryAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{order.deliveryAddress.street}</p>
                    <p>
                      {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                      {order.deliveryAddress.zipCode}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Delivery Type</p>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryType === "drone" ? "Drone Delivery" : "Pharmacy Pickup"}
                      </p>
                    </div>
                  </div>
                  {order.estimatedDeliveryTime && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Estimated Delivery</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.estimatedDeliveryTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{order.totalPrice || order.totalAmount}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>₹{order.totalPrice || order.totalAmount}</span>
                    </div>
                  </div>
                  {order.paymentId && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Payment ID: {order.paymentId}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}