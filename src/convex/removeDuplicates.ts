import { internalMutation } from "./_generated/server";

export const removeDuplicateMedicines = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allMedicines = await ctx.db.query("medicines").collect();
    
    // Group medicines by name
    const medicinesByName = new Map<string, typeof allMedicines>();
    
    for (const medicine of allMedicines) {
      const existing = medicinesByName.get(medicine.name);
      if (!existing) {
        medicinesByName.set(medicine.name, [medicine]);
      } else {
        existing.push(medicine);
      }
    }
    
    // Keep only the first occurrence of each medicine, delete the rest
    let deletedCount = 0;
    for (const [name, medicines] of medicinesByName.entries()) {
      if (medicines.length > 1) {
        // Keep the first one, delete the rest
        for (let i = 1; i < medicines.length; i++) {
          await ctx.db.delete(medicines[i]._id);
          deletedCount++;
        }
        console.log(`Removed ${medicines.length - 1} duplicates of "${name}"`);
      }
    }
    
    console.log(`Total duplicates removed: ${deletedCount}`);
    return { 
      message: `Successfully removed ${deletedCount} duplicate medicines`,
      uniqueMedicinesRemaining: medicinesByName.size
    };
  },
});

export const removeDuplicatePharmacies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allPharmacies = await ctx.db.query("pharmacies").collect();
    
    // Group pharmacies by name and address (to identify true duplicates)
    const pharmaciesByKey = new Map<string, typeof allPharmacies>();
    
    for (const pharmacy of allPharmacies) {
      // Create a unique key based on name and address
      const key = `${pharmacy.name.toLowerCase().trim()}|${pharmacy.address.toLowerCase().trim()}`;
      const existing = pharmaciesByKey.get(key);
      if (!existing) {
        pharmaciesByKey.set(key, [pharmacy]);
      } else {
        existing.push(pharmacy);
      }
    }
    
    // Keep only the first occurrence of each pharmacy, delete the rest
    let deletedCount = 0;
    for (const [key, pharmacies] of pharmaciesByKey.entries()) {
      if (pharmacies.length > 1) {
        // Keep the first one, delete the rest
        for (let i = 1; i < pharmacies.length; i++) {
          await ctx.db.delete(pharmacies[i]._id);
          deletedCount++;
        }
        console.log(`Removed ${pharmacies.length - 1} duplicates of "${pharmacies[0].name}" at "${pharmacies[0].address}"`);
      }
    }
    
    console.log(`Total pharmacy duplicates removed: ${deletedCount}`);
    return { 
      message: `Successfully removed ${deletedCount} duplicate pharmacies`,
      uniquePharmaciesRemaining: pharmaciesByKey.size
    };
  },
});