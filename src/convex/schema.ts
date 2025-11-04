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
    }).index("email", ["email"]),

    flights: defineTable({
      flightNumber: v.string(),
      origin: v.string(),
      destination: v.string(),
      departureTime: v.number(),
      arrivalTime: v.number(),
      aircraftType: v.string(),
      medicalEquipment: v.array(v.string()),
      availableSeats: v.number(),
      pricePerSeat: v.number(),
      status: v.union(
        v.literal("scheduled"),
        v.literal("boarding"),
        v.literal("departed"),
        v.literal("arrived"),
        v.literal("cancelled")
      ),
    })
      .index("by_origin", ["origin"])
      .index("by_destination", ["destination"])
      .index("by_status", ["status"]),

    bookings: defineTable({
      userId: v.id("users"),
      flightId: v.id("flights"),
      patientName: v.string(),
      patientAge: v.number(),
      medicalCondition: v.string(),
      emergencyContact: v.string(),
      specialRequirements: v.optional(v.string()),
      numberOfSeats: v.number(),
      totalPrice: v.number(),
      status: v.union(
        v.literal("confirmed"),
        v.literal("cancelled"),
        v.literal("completed")
      ),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  }
);

export default schema;