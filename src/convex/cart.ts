import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const itemsWithMedicines = await Promise.all(
      cartItems.map(async (item) => {
        const medicine = await ctx.db.get(item.medicineId);
        return { ...item, medicine };
      })
    );

    return itemsWithMedicines;
  },
});

export const add = mutation({
  args: {
    medicineId: v.id("medicines"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const medicine = await ctx.db.get(args.medicineId);
    if (!medicine) {
      throw new Error("Medicine not found");
    }

    if (!medicine.inStock) {
      throw new Error("Medicine is out of stock");
    }

    const existing = await ctx.db
      .query("cart")
      .withIndex("by_user_and_medicine", (q) =>
        q.eq("userId", user._id).eq("medicineId", args.medicineId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.quantity,
      });
      return existing._id;
    }

    return await ctx.db.insert("cart", {
      userId: user._id,
      medicineId: args.medicineId,
      quantity: args.quantity,
    });
  },
});

export const updateQuantity = mutation({
  args: {
    cartItemId: v.id("cart"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem || cartItem.userId !== user._id) {
      throw new Error("Cart item not found");
    }

    if (args.quantity <= 0) {
      await ctx.db.delete(args.cartItemId);
      return;
    }

    await ctx.db.patch(args.cartItemId, {
      quantity: args.quantity,
    });
  },
});

export const remove = mutation({
  args: {
    cartItemId: v.id("cart"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem || cartItem.userId !== user._id) {
      throw new Error("Cart item not found");
    }

    await ctx.db.delete(args.cartItemId);
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    await Promise.all(cartItems.map((item) => ctx.db.delete(item._id)));
  },
});
