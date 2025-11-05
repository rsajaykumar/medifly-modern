import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
    }).index("email", ["email"]),

    signInHistory: defineTable({
      userId: v.id("users"),
      signInTime: v.number(),
      userAgent: v.optional(v.string()),
      device: v.optional(v.string()),
    }).index("by_user", ["userId"]),

    userLocations: defineTable({
      userId: v.id("users"),
      encryptedLocation: v.string(),
      transcriptedLocation: v.string(),
      latitude: v.number(),
      longitude: v.number(),
      detectionMethod: v.union(v.literal("ip"), v.literal("gps")),
    }).index("by_user", ["userId"]),

    medicines: defineTable({
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
    })
      .index("by_category", ["category"])
      .index("by_stock", ["inStock"]),

    cart: defineTable({
      userId: v.id("users"),
      medicineId: v.id("medicines"),
      quantity: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_medicine", ["userId", "medicineId"]),

    orders: defineTable({
      userId: v.id("users"),
      items: v.array(
        v.object({
          medicineId: v.id("medicines"),
          medicineName: v.string(),
          quantity: v.number(),
          price: v.number(),
        })
      ),
      totalAmount: v.number(),
      totalPrice: v.optional(v.number()),
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
      deliveryType: v.optional(v.union(v.literal("drone"), v.literal("pickup"))),
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
      deliveryCity: v.optional(v.string()),
      deliveryState: v.optional(v.string()),
      deliveryZipCode: v.optional(v.string()),
      phone: v.string(),
      droneLocation: v.optional(
        v.object({
          latitude: v.number(),
          longitude: v.number(),
          altitude: v.optional(v.number()),
          speed: v.optional(v.number()),
        })
      ),
      geofenceEvents: v.optional(
        v.array(
          v.object({
            zone: v.string(),
            eventType: v.union(v.literal("entered"), v.literal("exited")),
            timestamp: v.number(),
          })
        )
      ),
      estimatedDeliveryTime: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
      paymentId: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"]),

    flights: defineTable({
      orderId: v.optional(v.id("orders")),
      droneId: v.string(),
      status: v.union(
        v.literal("scheduled"),
        v.literal("in_transit"),
        v.literal("delivered"),
        v.literal("cancelled")
      ),
      startLatitude: v.number(),
      startLongitude: v.number(),
      endLatitude: v.number(),
      endLongitude: v.number(),
      currentLatitude: v.optional(v.number()),
      currentLongitude: v.optional(v.number()),
      departureTime: v.number(),
      estimatedArrival: v.number(),
      actualArrival: v.optional(v.number()),
    })
      .index("by_status", ["status"])
      .index("by_order", ["orderId"]),

    pharmacies: defineTable({
      name: v.string(),
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      phone: v.string(),
      latitude: v.number(),
      longitude: v.number(),
      isActive: v.boolean(),
    })
      .index("by_city", ["city"])
      .index("by_active", ["isActive"]),
  },
  {
    schemaValidation: false,
  }
);

export default schema;