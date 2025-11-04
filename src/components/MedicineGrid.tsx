import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function MedicineGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const medicines = useQuery(api.medicines.list, {});
  const addToCart = useMutation(api.cart.add);

  const handleAddToCart = async (medicineId: any, medicineName: string) => {
    try {
      await addToCart({ medicineId, quantity: 1 });
      toast.success(`${medicineName} added to cart`);
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  if (medicines === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredMedicines = medicines.filter((medicine) => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || medicine.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(medicines.map(m => m.category)))];

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Medicine Grid */}
      {filteredMedicines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No medicines found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedicines.map((medicine, index) => (
            <motion.div
              key={medicine._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="aspect-square relative mb-3 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={medicine.imageUrl}
                      alt={medicine.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">{medicine.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-1">{medicine.dosage}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {medicine.description}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {medicine.category}
                    </Badge>
                    {medicine.requiresPrescription && (
                      <Badge variant="outline" className="text-xs">
                        Rx Required
                      </Badge>
                    )}
                    {medicine.inStock ? (
                      <Badge variant="default" className="text-xs bg-green-500">
                        In Stock
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-3 flex items-center justify-between">
                  <span className="text-2xl font-bold">₹{medicine.price.toFixed(2)}</span>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(medicine._id, medicine.name)}
                    disabled={!medicine.inStock}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
