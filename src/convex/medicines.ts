import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Fuzzy search helper function
function fuzzyMatch(searchTerm: string, target: string): number {
  const search = searchTerm.toLowerCase();
  const text = target.toLowerCase();
  
  // Exact match gets highest score
  if (text === search) return 100;
  
  // Contains exact substring gets high score
  if (text.includes(search)) return 80;
  
  // Calculate Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(search, text);
  const maxLength = Math.max(search.length, text.length);
  const similarity = ((maxLength - distance) / maxLength) * 60;
  
  return similarity;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

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

    // Filter by stock first to reduce dataset
    medicines = medicines.filter((m) => m.inStock);

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      
      // Fast path: exact or substring matches first
      const exactMatches: typeof medicines = [];
      const fuzzyMatches: Array<{ medicine: typeof medicines[0], score: number }> = [];
      
      for (const m of medicines) {
        const nameLower = m.name.toLowerCase();
        const descLower = m.description.toLowerCase();
        
        // Check for exact or substring matches (fast)
        if (nameLower.includes(query) || descLower.includes(query)) {
          exactMatches.push(m);
        } else {
          // Only do expensive fuzzy matching if no substring match
          const nameScore = fuzzyMatch(query, m.name);
          const descScore = fuzzyMatch(query, m.description);
          const maxScore = Math.max(nameScore, descScore);
          
          if (maxScore > 30) {
            fuzzyMatches.push({ medicine: m, score: maxScore });
          }
        }
      }
      
      // Combine results: exact matches first, then fuzzy matches sorted by score
      medicines = [
        ...exactMatches,
        ...fuzzyMatches.sort((a, b) => b.score - a.score).map(item => item.medicine)
      ];
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