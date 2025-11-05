import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Update drone locations every 5 minutes for all active deliveries
crons.interval(
  "update drone locations",
  { minutes: 5 },
  internal.droneSimulation.updateAllDrones
);

export default crons;
