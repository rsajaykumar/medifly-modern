import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Seed medicines
    const medicines = [
      {
        name: "Paracetamol 500mg",
        description: "Pain reliever and fever reducer",
        category: "Pain Relief",
        price: 5.99,
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
        inStock: true,
        requiresPrescription: false,
        manufacturer: "PharmaCorp",
        dosage: "500mg",
        quantity: 100,
      },
      {
        name: "Amoxicillin 250mg",
        description: "Antibiotic for bacterial infections",
        category: "Antibiotics",
        price: 12.99,
        imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400",
        inStock: true,
        requiresPrescription: true,
        manufacturer: "MediPharm",
        dosage: "250mg",
        quantity: 50,
      },
      {
        name: "Ibuprofen 400mg",
        description: "Anti-inflammatory pain reliever",
        category: "Pain Relief",
        price: 8.99,
        imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400",
        inStock: true,
        requiresPrescription: false,
        manufacturer: "HealthPlus",
        dosage: "400mg",
        quantity: 75,
      },
      {
        name: "Cetirizine 10mg",
        description: "Antihistamine for allergies",
        category: "Allergy",
        price: 9.99,
        imageUrl: "https://images.unsplash.com/photo-1550572017-4a6e8e8e4e8e?w=400",
        inStock: true,
        requiresPrescription: false,
        manufacturer: "AllergyFree",
        dosage: "10mg",
        quantity: 60,
      },
      {
        name: "Omeprazole 20mg",
        description: "Proton pump inhibitor for acid reflux",
        category: "Digestive Health",
        price: 15.99,
        imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400",
        inStock: true,
        requiresPrescription: true,
        manufacturer: "GastroMed",
        dosage: "20mg",
        quantity: 40,
      },
    ];

    for (const medicine of medicines) {
      await ctx.db.insert("medicines", medicine);
    }

    // Seed pharmacies
    const pharmacies = [
      {
        name: "Central Pharmacy",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        phone: "+1-212-555-0100",
        latitude: 40.7128,
        longitude: -74.0060,
        isActive: true,
      },
      {
        name: "HealthCare Pharmacy",
        address: "456 Oak Ave",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90001",
        phone: "+1-213-555-0200",
        latitude: 34.0522,
        longitude: -118.2437,
        isActive: true,
      },
    ];

    for (const pharmacy of pharmacies) {
      await ctx.db.insert("pharmacies", pharmacy);
    }

    return { 
      message: "Seed data created successfully", 
      medicinesCount: medicines.length,
      pharmaciesCount: pharmacies.length,
    };
  },
});
