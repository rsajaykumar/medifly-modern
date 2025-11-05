import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const storeUserLocation = internalMutation({
  args: {
    userId: v.id("users"),
    encryptedLocation: v.string(),
    transcriptedLocation: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    detectionMethod: v.union(v.literal("ip"), v.literal("gps")),
  },
  handler: async (ctx, args) => {
    // Check if user already has a location entry
    const existingLocation = await ctx.db
      .query("userLocations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingLocation) {
      // Update existing location
      await ctx.db.patch(existingLocation._id, {
        encryptedLocation: args.encryptedLocation,
        transcriptedLocation: args.transcriptedLocation,
        latitude: args.latitude,
        longitude: args.longitude,
        detectionMethod: args.detectionMethod,
      });
    } else {
      // Create new location entry
      await ctx.db.insert("userLocations", {
        userId: args.userId,
        encryptedLocation: args.encryptedLocation,
        transcriptedLocation: args.transcriptedLocation,
        latitude: args.latitude,
        longitude: args.longitude,
        detectionMethod: args.detectionMethod,
      });
    }
  },
});
