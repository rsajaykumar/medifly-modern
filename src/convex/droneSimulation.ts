"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const updateAllDrones = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all active flights (in_transit status)
    const activeFlights = await ctx.runQuery(internal.flights.listActive);
    
    if (!activeFlights || activeFlights.length === 0) {
      console.log("No active flights to update");
      return;
    }

    console.log(`Updating ${activeFlights.length} active drone flights`);

    // Update each flight's location
    for (const flight of activeFlights) {
      try {
        await ctx.runMutation(internal.flights.updateDroneLocation, {
          flightId: flight._id,
        });
      } catch (error) {
        console.error(`Failed to update flight ${flight._id}:`, error);
      }
    }
  },
});
