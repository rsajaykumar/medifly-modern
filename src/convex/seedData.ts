import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const flights = [
      {
        flightNumber: "MF101",
        origin: "New York",
        destination: "Los Angeles",
        departureTime: now + oneDay,
        arrivalTime: now + oneDay + 6 * 60 * 60 * 1000,
        aircraftType: "Learjet 45",
        medicalEquipment: ["ICU Equipment", "Ventilator", "Cardiac Monitor", "Defibrillator"],
        availableSeats: 2,
        pricePerSeat: 25000,
        status: "scheduled" as const,
      },
      {
        flightNumber: "MF102",
        origin: "Chicago",
        destination: "Miami",
        departureTime: now + 2 * oneDay,
        arrivalTime: now + 2 * oneDay + 3 * 60 * 60 * 1000,
        aircraftType: "Citation X",
        medicalEquipment: ["ICU Equipment", "Oxygen System", "Medical Stretcher"],
        availableSeats: 1,
        pricePerSeat: 18000,
        status: "scheduled" as const,
      },
      {
        flightNumber: "MF103",
        origin: "Los Angeles",
        destination: "Seattle",
        departureTime: now + 3 * oneDay,
        arrivalTime: now + 3 * oneDay + 2.5 * 60 * 60 * 1000,
        aircraftType: "King Air 350",
        medicalEquipment: ["Ventilator", "Cardiac Monitor", "IV Pumps", "Oxygen System"],
        availableSeats: 3,
        pricePerSeat: 15000,
        status: "scheduled" as const,
      },
      {
        flightNumber: "MF104",
        origin: "Boston",
        destination: "Denver",
        departureTime: now + 4 * oneDay,
        arrivalTime: now + 4 * oneDay + 4 * 60 * 60 * 1000,
        aircraftType: "Challenger 604",
        medicalEquipment: ["ICU Equipment", "Ventilator", "Cardiac Monitor", "Medical Stretcher", "Defibrillator"],
        availableSeats: 2,
        pricePerSeat: 22000,
        status: "scheduled" as const,
      },
      {
        flightNumber: "MF105",
        origin: "Miami",
        destination: "New York",
        departureTime: now + 5 * oneDay,
        arrivalTime: now + 5 * oneDay + 3 * 60 * 60 * 1000,
        aircraftType: "Gulfstream G550",
        medicalEquipment: ["ICU Equipment", "Ventilator", "Cardiac Monitor", "Oxygen System", "IV Pumps"],
        availableSeats: 4,
        pricePerSeat: 30000,
        status: "scheduled" as const,
      },
    ];

    for (const flight of flights) {
      await ctx.db.insert("flights", flight);
    }

    return { message: "Seed data created successfully", count: flights.length };
  },
});
