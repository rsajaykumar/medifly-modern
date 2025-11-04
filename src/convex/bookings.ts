import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const create = mutation({
  args: {
    flightId: v.id("flights"),
    patientName: v.string(),
    patientAge: v.number(),
    medicalCondition: v.string(),
    emergencyContact: v.string(),
    specialRequirements: v.optional(v.string()),
    numberOfSeats: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const flight = await ctx.db.get(args.flightId);
    if (!flight) {
      throw new Error("Flight not found");
    }

    if (flight.availableSeats < args.numberOfSeats) {
      throw new Error("Not enough seats available");
    }

    const bookingId = await ctx.db.insert("bookings", {
      userId: user._id,
      flightId: args.flightId,
      patientName: args.patientName,
      patientAge: args.patientAge,
      medicalCondition: args.medicalCondition,
      emergencyContact: args.emergencyContact,
      specialRequirements: args.specialRequirements,
      numberOfSeats: args.numberOfSeats,
      status: "confirmed",
      totalPrice: flight.pricePerSeat * args.numberOfSeats,
    });

    await ctx.db.patch(args.flightId, {
      availableSeats: flight.availableSeats - args.numberOfSeats,
    });

    return bookingId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const bookingsWithFlights = await Promise.all(
      bookings.map(async (booking) => {
        const flight = await ctx.db.get(booking.flightId);
        return { ...booking, flight };
      })
    );

    return bookingsWithFlights;
  },
});

export const get = query({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const booking = await ctx.db.get(args.id);
    if (!booking || booking.userId !== user._id) {
      return null;
    }

    const flight = await ctx.db.get(booking.flightId);
    return { ...booking, flight };
  },
});

export const cancel = mutation({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const booking = await ctx.db.get(args.id);
    if (!booking || booking.userId !== user._id) {
      throw new Error("Booking not found");
    }

    const flight = await ctx.db.get(booking.flightId);
    if (flight) {
      await ctx.db.patch(booking.flightId, {
        availableSeats: flight.availableSeats + booking.numberOfSeats,
      });
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
    });
  },
});
