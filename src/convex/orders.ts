import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

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
    deliveryAddress: v.string(),
    deliveryCity: v.string(),
    deliveryState: v.string(),
    deliveryZipCode: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const orderId = await ctx.db.insert("orders", {
      userId: user._id,
      items: args.items,
      totalAmount: args.totalAmount,
      status: "pending",
      deliveryAddress: args.deliveryAddress,
      deliveryCity: args.deliveryCity,
      deliveryState: args.deliveryState,
      deliveryZipCode: args.deliveryZipCode,
      phone: args.phone,
      estimatedDeliveryTime: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    return orderId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return orders;
  },
});

export const get = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const order = await ctx.db.get(args.id);
    if (!order || order.userId !== user._id) {
      return null;
    }

    return order;
  },
});

export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== user._id) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      status: args.status,
      ...(args.status === "delivered" && { deliveredAt: Date.now() }),
    });
  },
});
