import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.users.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return null;
    }
    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

/**
 * Update user profile with name and phone number
 */
export const updateProfile = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId, {
      name: args.name,
      phone: args.phone,
    });

    return { success: true };
  },
});

/**
 * Update user address information
 */
export const updateAddress = mutation({
  args: {
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId, {
      address: args.address,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
    });

    return { success: true };
  },
});

/**
 * Log a sign-in event for the current user
 */
export const logSignIn = mutation({
  args: {
    userAgent: v.optional(v.string()),
    device: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Log sign-in history
    await ctx.db.insert("signInHistory", {
      userId,
      signInTime: Date.now(),
      userAgent: args.userAgent,
      device: args.device,
    });

    return { success: true };
  },
});

/**
 * Get sign-in history for the current user
 */
export const getSignInHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const limit = args.limit || 10;

    const history = await ctx.db
      .query("signInHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return history;
  },
});