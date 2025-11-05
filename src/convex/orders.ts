import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    items: v.array(
      v.object({
        medicineId: v.id("medicines"),
        medicineName: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    totalAmount: v.number(),
    deliveryType: v.union(v.literal("drone"), v.literal("pickup")),
    deliveryAddress: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const orderId = await ctx.db.insert("orders", {
      userId,
      items: args.items,
      totalAmount: args.totalAmount,
      totalPrice: args.totalAmount,
      status: "pending",
      deliveryType: args.deliveryType,
      deliveryAddress: args.deliveryAddress,
      phone: args.phone,
      estimatedDeliveryTime: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    return orderId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return orders;
  },
});

export const get = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const order = await ctx.db.get(args.id);
    if (!order || order.userId !== userId) {
      return null;
    }

    return order;
  },
});

export const updateStatus = internalMutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("in_transit"),
      v.literal("in_flight"),
      v.literal("delivered"),
      v.literal("picked_up"),
      v.literal("ready_for_pickup"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // When order moves to in_flight, initialize drone location at pharmacy
    if (args.status === "in_flight" && order.deliveryType === "drone") {
      await ctx.db.patch(args.orderId, {
        status: args.status,
        droneLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          altitude: 0,
          speed: 0,
        },
      });
    } else {
      await ctx.db.patch(args.orderId, {
        status: args.status,
        ...(args.status === "delivered" && { deliveredAt: Date.now() }),
      });
    }
  },
});

export const cancel = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) {
      throw new Error("Order not found");
    }

    if (order.status !== "pending" && order.status !== "confirmed") {
      throw new Error("Order cannot be cancelled at this stage");
    }

    await ctx.db.patch(args.orderId, {
      status: "cancelled",
    });
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    await Promise.all(orders.map((order) => ctx.db.delete(order._id)));

    return { deletedCount: orders.length };
  },
});

export const updatePaymentDetails = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentId: v.string(),
    paymentStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      paymentId: args.paymentId,
    });
  },
});