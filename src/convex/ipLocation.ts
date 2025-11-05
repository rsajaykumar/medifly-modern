"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import IPLocate from "node-iplocate";

export const getCurrentLocation = action({
  args: {},
  handler: async (ctx) => {
    try {
      const apiKey = process.env.IPLOCATE_API_KEY;
      
      if (!apiKey) {
        console.warn("IPLOCATE_API_KEY not set, falling back to browser geolocation");
        return null;
      }

      const client = new IPLocate(apiKey);
      const result = await client.lookupSelf();
      
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        country: result.country,
        region: result.region,
        accuracy: 1000, // IP-based location typically accurate to ~1km
      };
    } catch (error) {
      console.error("IP location lookup failed:", error);
      return null;
    }
  },
});

export const lookupIP = action({
  args: { ip: v.string() },
  handler: async (ctx, args) => {
    try {
      const apiKey = process.env.IPLOCATE_API_KEY;
      
      if (!apiKey) {
        throw new Error("IPLOCATE_API_KEY not configured");
      }

      const client = new IPLocate(apiKey);
      const result = await client.lookup(args.ip);
      
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        country: result.country,
        region: result.region,
        timezone: result.time_zone,
        isp: result.asn?.name,
      };
    } catch (error) {
      console.error("IP lookup failed:", error);
      throw error;
    }
  },
});
