/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as cart from "../cart.js";
import type * as crons from "../crons.js";
import type * as droneSimulation from "../droneSimulation.js";
import type * as droneSimulationHelpers from "../droneSimulationHelpers.js";
import type * as flights from "../flights.js";
import type * as http from "../http.js";
import type * as location from "../location.js";
import type * as locationMutations from "../locationMutations.js";
import type * as medicines from "../medicines.js";
import type * as orders from "../orders.js";
import type * as pharmacies from "../pharmacies.js";
import type * as phonepe from "../phonepe.js";
import type * as seedData from "../seedData.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  bookings: typeof bookings;
  cart: typeof cart;
  crons: typeof crons;
  droneSimulation: typeof droneSimulation;
  droneSimulationHelpers: typeof droneSimulationHelpers;
  flights: typeof flights;
  http: typeof http;
  location: typeof location;
  locationMutations: typeof locationMutations;
  medicines: typeof medicines;
  orders: typeof orders;
  pharmacies: typeof pharmacies;
  phonepe: typeof phonepe;
  seedData: typeof seedData;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
