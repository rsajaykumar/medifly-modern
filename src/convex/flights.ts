import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

export const listActive = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("flights")
      .withIndex("by_status", (q) => q.eq("status", "in_transit"))
      .collect();
  },
});

export const updateDroneLocation = internalMutation({
  args: {
    flightId: v.id("flights"),
  },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.flightId);
    if (!flight) {
      throw new Error("Flight not found");
    }

    // Simulate drone movement along the route
    // Calculate progress based on time elapsed
    const now = Date.now();
    const elapsed = now - flight.departureTime;
    const totalDuration = flight.estimatedArrival - flight.departureTime;
    const progress = Math.min(elapsed / totalDuration, 1);

    // Simple linear interpolation between start and end coordinates
    const currentLat = flight.startLatitude + (flight.endLatitude - flight.startLatitude) * progress;
    const currentLng = flight.startLongitude + (flight.endLongitude - flight.startLongitude) * progress;

    // Update flight location
    await ctx.db.patch(args.flightId, {
      currentLatitude: currentLat,
      currentLongitude: currentLng,
    });

    // If flight has reached destination, mark as delivered
    if (progress >= 1) {
      await ctx.db.patch(args.flightId, {
        status: "delivered",
        actualArrival: now,
      });

      // Update associated order status
      if (flight.orderId) {
        await ctx.db.patch(flight.orderId, {
          status: "delivered",
        });
      }
    }
  },
});