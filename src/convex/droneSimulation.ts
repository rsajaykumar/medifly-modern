"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Action to update all active drones
export const updateAllDrones = internalAction({
  args: {},
  handler: async (ctx) => {
    const activeOrders = await ctx.runQuery(internal.droneSimulationHelpers.getActiveDeliveries);
        
    // Update each drone's position
    for (const order of activeOrders) {
      await ctx.runMutation(internal.droneSimulationHelpers.simulateDroneMovement, {
        orderId: order._id,
      });
    }
  },
});