import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Get all orders that are currently in flight
export const getActiveDeliveries = internalQuery({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "in_flight"))
      .collect();
        
    return orders;
  },
});

// Define geofence zones (in km radius from pharmacy)
const GEOFENCE_ZONES = {
  DEPARTURE: 0.5,  // 500m from pharmacy
  MIDWAY: 2,       // 2km from pharmacy
  ARRIVAL: 0.5,    // 500m from delivery location
};

// Calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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
}

// Check geofence zones and return events
function checkGeofenceZones(
  currentLat: number,
  currentLon: number,
  prevLat: number,
  prevLon: number,
  pharmacyLat: number,
  pharmacyLon: number,
  destLat: number,
  destLon: number
): Array<{ zone: string; eventType: "entered" | "exited" }> {
  const events: Array<{ zone: string; eventType: "entered" | "exited" }> = [];
    
  const currentDistFromPharmacy = calculateDistance(currentLat, currentLon, pharmacyLat, pharmacyLon);
  const prevDistFromPharmacy = calculateDistance(prevLat, prevLon, pharmacyLat, pharmacyLon);
  const currentDistFromDest = calculateDistance(currentLat, currentLon, destLat, destLon);
  const prevDistFromDest = calculateDistance(prevLat, prevLon, destLat, destLon);
    
  // Check departure zone
  if (prevDistFromPharmacy <= GEOFENCE_ZONES.DEPARTURE && currentDistFromPharmacy > GEOFENCE_ZONES.DEPARTURE) {
    events.push({ zone: "Departure Zone", eventType: "exited" });
  }
    
  // Check midway zone
  if (prevDistFromPharmacy <= GEOFENCE_ZONES.MIDWAY && currentDistFromPharmacy > GEOFENCE_ZONES.MIDWAY) {
    events.push({ zone: "Midway Zone", eventType: "exited" });
  }
    
  // Check arrival zone
  if (prevDistFromDest > GEOFENCE_ZONES.ARRIVAL && currentDistFromDest <= GEOFENCE_ZONES.ARRIVAL) {
    events.push({ zone: "Arrival Zone", eventType: "entered" });
  }
    
  return events;
}

// Simulate drone movement towards delivery location
export const simulateDroneMovement = internalMutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
        
    if (!order || order.status !== "in_flight" || !order.deliveryAddress) {
      return;
    }
    
    // Starting point (pharmacy)
    const pharmacyLat = 12.9716;
    const pharmacyLon = 77.5946;
        
    // Destination
    const destLat = order.deliveryAddress.latitude;
    const destLon = order.deliveryAddress.longitude;
        
    // Current drone location (or start at pharmacy if not set)
    const currentLat = order.droneLocation?.latitude || pharmacyLat;
    const currentLon = order.droneLocation?.longitude || pharmacyLon;
        
    // Previous location for geofence checking
    const prevLat = currentLat;
    const prevLon = currentLon;
        
    // Calculate distance to destination
    const distanceRemaining = Math.sqrt(
      Math.pow(destLat - currentLat, 2) + Math.pow(destLon - currentLon, 2)
    );
        
    // If very close to destination, mark as delivered
    if (distanceRemaining < 0.001) {
      const finalEvents = checkGeofenceZones(
        destLat, destLon, prevLat, prevLon,
        pharmacyLat, pharmacyLon, destLat, destLon
      );
            
      const existingEvents = order.geofenceEvents || [];
      const newEvents = finalEvents.map(e => ({
        ...e,
        timestamp: Date.now(),
      }));
            
      await ctx.db.patch(args.orderId, {
        status: "delivered",
        droneLocation: {
          latitude: destLat,
          longitude: destLon,
          altitude: 0,
          speed: 0,
        },
        geofenceEvents: [...existingEvents, ...newEvents],
      });
      return;
    }
        
    // Move drone 2% of the remaining distance each update (smooth movement)
    const moveRatio = 0.02;
    const newLat = currentLat + (destLat - currentLat) * moveRatio;
    const newLon = currentLon + (destLon - currentLon) * moveRatio;
        
    // Check for geofence events
    const geofenceEvents = checkGeofenceZones(
      newLat, newLon, prevLat, prevLon,
      pharmacyLat, pharmacyLon, destLat, destLon
    );
        
    // Simulate altitude and speed
    const altitude = 50 + Math.random() * 20; // 50-70 meters
    const speed = 40 + Math.random() * 20; // 40-60 km/h
        
    // Update drone location and add geofence events
    const existingEvents = order.geofenceEvents || [];
    const newEvents = geofenceEvents.map(e => ({
      ...e,
      timestamp: Date.now(),
    }));
        
    await ctx.db.patch(args.orderId, {
      droneLocation: {
        latitude: newLat,
        longitude: newLon,
        altitude,
        speed,
      },
      estimatedDeliveryTime: Date.now() + Math.ceil(distanceRemaining * 100000), // Rough ETA
      geofenceEvents: [...existingEvents, ...newEvents],
    });
  },
});
