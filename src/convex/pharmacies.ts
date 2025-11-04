import { v } from "convex/values";
import { query } from "./_generated/server";

export const listNearby = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.number(),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const pharmacies = await ctx.db
      .query("pharmacies")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Calculate distance for each pharmacy
    const pharmaciesWithDistance = pharmacies.map((pharmacy) => {
      const distance = calculateDistance(
        args.latitude,
        args.longitude,
        pharmacy.latitude,
        pharmacy.longitude
      );

      return {
        ...pharmacy,
        distance,
        rating: 4.5, // Mock rating
        openHours: "Open 24/7", // Mock hours
      };
    });

    // Filter by radius and search query
    let filtered = pharmaciesWithDistance.filter(
      (p) => p.distance <= args.radiusKm
    );

    if (args.searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(args.searchQuery.toLowerCase())
      );
    }

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance);

    return filtered;
  },
});

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
