"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import crypto from "crypto";

// Encrypt location data
function encryptLocation(location: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.LOCATION_ENCRYPTION_KEY || 'default-key-change-me', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(location, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

// Decrypt location data
function decryptLocation(encryptedData: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.LOCATION_ENCRYPTION_KEY || 'default-key-change-me', 'salt', 32);
    
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    return 'Location unavailable';
  }
}

// Transcript location to readable format (obfuscated)
function transcriptLocation(city: string, region: string, country: string): string {
  // Create a readable but partially obfuscated location string
  const cityObfuscated = city.substring(0, 3) + '***';
  return `${cityObfuscated}, ${region}, ${country}`;
}

export const detectLocationFromIP = action({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new Error("Not authenticated");
      }

      // Call IP Locator API
      const apiKey = process.env.IPLOCATE_API_KEY;
      if (!apiKey) {
        throw new Error("IP Locator API key not configured");
      }

      // Get IP from request (in production, you'd get this from the request headers)
      // For now, we'll use a placeholder that gets the user's IP
      const response = await fetch(`https://www.iplocate.io/api/lookup`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch IP location");
      }

      const data = await response.json();
      
      // Extract location data
      const locationData = {
        city: data.city || 'Unknown',
        region: data.subdivision || data.country || 'Unknown',
        country: data.country || 'Unknown',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        ip: data.ip || 'Unknown',
      };

      // Create full location string
      const fullLocation = `${locationData.city}, ${locationData.region}, ${locationData.country}`;
      
      // Encrypt the full location
      const encryptedLocation = encryptLocation(fullLocation);
      
      // Create transcripted (obfuscated) version
      const transcriptedLocation = transcriptLocation(
        locationData.city,
        locationData.region,
        locationData.country
      );

      // Store in database
      await ctx.runMutation(internal.locationMutations.storeUserLocation, {
        userId,
        encryptedLocation,
        transcriptedLocation,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        detectionMethod: 'ip',
      });

      return {
        success: true,
        transcriptedLocation,
        encryptedLocation,
        coordinates: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
      };
    } catch (error: any) {
      console.error("IP location detection error:", error);
      return {
        success: false,
        error: error.message || "Failed to detect location",
      };
    }
  },
});

export const detectLocationFromGPS = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new Error("Not authenticated");
      }

      // Reverse geocode to get city/region/country
      // Using a free geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${args.latitude}&lon=${args.longitude}`,
        {
          headers: {
            'User-Agent': 'Medifly-App',
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reverse geocode location");
      }

      const data = await response.json();
      const address = data.address || {};
      
      const locationData = {
        city: address.city || address.town || address.village || 'Unknown',
        region: address.state || address.region || 'Unknown',
        country: address.country || 'Unknown',
      };

      // Create full location string
      const fullLocation = `${locationData.city}, ${locationData.region}, ${locationData.country}`;
      
      // Encrypt the full location
      const encryptedLocation = encryptLocation(fullLocation);
      
      // Create transcripted (obfuscated) version
      const transcriptedLocation = transcriptLocation(
        locationData.city,
        locationData.region,
        locationData.country
      );

      // Store in database
      await ctx.runMutation(internal.locationMutations.storeUserLocation, {
        userId,
        encryptedLocation,
        transcriptedLocation,
        latitude: args.latitude,
        longitude: args.longitude,
        detectionMethod: 'gps',
      });

      return {
        success: true,
        transcriptedLocation,
        encryptedLocation,
        coordinates: {
          latitude: args.latitude,
          longitude: args.longitude,
        },
      };
    } catch (error: any) {
      console.error("GPS location detection error:", error);
      return {
        success: false,
        error: error.message || "Failed to detect location",
      };
    }
  },
});
