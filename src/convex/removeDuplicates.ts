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
