import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const list = query({
  args: {
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let medicines;

    if (args.category) {
      medicines = await ctx.db
        .query("medicines")
        .withIndex("by_category", (q) => q.eq("category", args.category as string))
        .collect();
    } else {
      medicines = await ctx.db.query("medicines").collect();
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      medicines = medicines.filter(
        (med) =>
          med.name.toLowerCase().includes(query) ||
          med.description.toLowerCase().includes(query)
      );
    }

    return medicines;
  },
});

export const get = query({
  args: { id: v.id("medicines") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    price: v.number(),
    imageUrl: v.string(),
    inStock: v.boolean(),
    requiresPrescription: v.boolean(),
    manufacturer: v.optional(v.string()),
    dosage: v.optional(v.string()),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("medicines", args);
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const medicines = await ctx.db.query("medicines").collect();
    const categories = Array.from(new Set(medicines.map(m => m.category)));
    return categories.sort();
  },
});