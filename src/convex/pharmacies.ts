import { v } from "convex/values";
import { query } from "./_generated/server";

// Levenshtein distance calculation for fuzzy search
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[len1][len2];
}

function calculateSimilarity(query: string, target: string): number {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  if (targetLower.includes(queryLower)) {
    return 100;
  }
  const distance = levenshteinDistance(queryLower, targetLower);
  const maxLength = Math.max(queryLower.length, targetLower.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  return similarity;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const listNearby = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.number(),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const pharmacies = await ctx.db
      .query("pharmacies")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Calculate distance for each pharmacy
    const pharmaciesWithDistance = pharmacies.map((pharmacy) => {
      const distance = calculateDistance(
        args.latitude,
        args.longitude,
        pharmacy.latitude,
        pharmacy.longitude
      );

      return {
        ...pharmacy,
        distance,
        rating: 4.5, // Mock rating
        openHours: "Open 24/7", // Mock hours
      };
    });

    // Filter by radius
    let filtered = pharmaciesWithDistance.filter(
      (p) => p.distance <= args.radiusKm
    );

    // Fuzzy search filter with scoring
    if (args.searchQuery && args.searchQuery.trim()) {
      const query = args.searchQuery.trim();
      
      filtered = filtered
        .map((pharmacy) => {
          const nameScore = calculateSimilarity(query, pharmacy.name);
          const addressScore = calculateSimilarity(query, pharmacy.address);
          
          // Phone number matching - exact digits or formatted
          const cleanQuery = query.replace(/\D/g, '');
          const cleanPhone = pharmacy.phone.replace(/\D/g, '');
          const phoneScore = cleanPhone.includes(cleanQuery) && cleanQuery.length >= 3 ? 100 : 0;
          
          // Weighted scoring: name is most important, then address, then phone
          const weightedScore = (nameScore * 0.5) + (addressScore * 0.35) + (phoneScore * 0.15);
          
          return {
            ...pharmacy,
            searchScore: weightedScore,
          };
        })
        .filter((pharmacy) => pharmacy.searchScore > 25)
        .sort((a, b) => b.searchScore - a.searchScore);
    } else {
      // Sort by distance if no search query
      filtered.sort((a, b) => a.distance - b.distance);
    }

    return filtered;
  },
});