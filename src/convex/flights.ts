import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const list = query({
  args: {
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let flights;

    if (args.origin) {
      flights = await ctx.db
        .query("flights")
        .withIndex("by_origin", (q) => q.eq("origin", args.origin as string))
        .collect();
    } else {
      flights = await ctx.db.query("flights").collect();
    }

    return flights.filter((flight) => {
      if (args.destination && flight.destination !== args.destination) {
        return false;
      }
      if (args.date && flight.departureTime < args.date) {
        return false;
      }
      return flight.availableSeats > 0;
    });
  },
});

export const get = query({
  args: { id: v.id("flights") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    flightNumber: v.string(),
    origin: v.string(),
    destination: v.string(),
    departureTime: v.number(),
    arrivalTime: v.number(),
    aircraftType: v.string(),
    medicalEquipment: v.array(v.string()),
    availableSeats: v.number(),
    pricePerSeat: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("flights", {
      ...args,
      status: "scheduled",
    });
  },
});
