import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2, Info, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MedicineGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMedicineId, setSelectedMedicineId] = useState<Id<"medicines"> | null>(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  
  const categories = useQuery(api.medicines.getCategories);
  const medicines = useQuery(api.medicines.list, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
    searchQuery: debouncedSearch || undefined,
  });
  
  const displayedMedicines = medicines?.slice(0, displayLimit) ?? [];
  const hasMore = (medicines?.length ?? 0) > displayLimit;
  
  const selectedMedicine = useQuery(
    api.medicines.get,
    selectedMedicineId ? { id: selectedMedicineId } : "skip"
  );
  
  const addToCart = useMutation(api.cart.add);
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const [addingToCart, setAddingToCart] = useState<Id<"medicines"> | null>(null);
  const [updatingCart, setUpdatingCart] = useState<Id<"cart"> | null>(null);
  
  const cartItems = useQuery(api.cart.list);

  // Debounce search query - reduced to 200ms for faster response
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset display limit when search or category changes
  useEffect(() => {
    setDisplayLimit(20);
  }, [debouncedSearch, selectedCategory]);

  const handleAddToCart = async (medicineId: Id<"medicines">, medicineName: string) => {
    setAddingToCart(medicineId);
    try {
      await addToCart({ medicineId, quantity: 1 });
      toast.success(`${medicineName} added to cart`);
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  const handleUpdateQuantity = async (cartItemId: Id<"cart">, currentQuantity: number, delta: number, medicineName: string) => {
    const newQuantity = currentQuantity + delta;
    
    if (newQuantity < 0) return;
    
    setUpdatingCart(cartItemId);
    try {
      await updateQuantity({ cartItemId, quantity: newQuantity });
      if (newQuantity === 0) {
        toast.success(`${medicineName} removed from cart`);
      } else {
        toast.success(`Updated ${medicineName} quantity`);
      }
    } catch (error) {
      toast.error("Failed to update cart");
    } finally {
      setUpdatingCart(null);
    }
  };

  // Memoize cart lookup map for better performance
  const cartItemsMap = useMemo(() => {
    if (!cartItems) return new Map();
    const map = new Map<Id<"medicines">, typeof cartItems[0]>();
    cartItems.forEach(item => {
      map.set(item.medicineId, item);
    });
    return map;
  }, [cartItems]);

  const getCartItem = (medicineId: Id<"medicines">) => {
    return cartItemsMap.get(medicineId);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Medicine Grid */}
      {medicines === undefined ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : medicines.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">
            {searchQuery ? "No medicines found matching your search" : "No medicines found"}
          </p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search terms or check for typos
            </p>
          )}
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedMedicines.map((medicine, index) => (
              <motion.div
                key={medicine._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
              >
                <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
                  <CardContent className="p-4 flex-1">
                    <Badge variant="secondary" className="mb-2">
                      {medicine.category}
                    </Badge>
                    <h3 className="font-bold tracking-tight mb-1 text-lg">{medicine.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {medicine.description}
                    </p>
                    {medicine.dosage && (
                      <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded inline-block">
                        {medicine.dosage}
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full text-xs"
                      onClick={() => setSelectedMedicineId(medicine._id)}
                    >
                      <Info className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">₹{medicine.price}</span>
                    {(() => {
                      const cartItem = getCartItem(medicine._id);
                      const isUpdating = updatingCart === cartItem?._id;
                      
                      if (cartItem) {
                        return (
                          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(cartItem._id, cartItem.quantity, -1, medicine.name)}
                              disabled={isUpdating}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold text-base min-w-[2ch] text-center">
                              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin inline" /> : cartItem.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(cartItem._id, cartItem.quantity, 1, medicine.name)}
                              disabled={isUpdating}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      }
                      
                      return (
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(medicine._id, medicine.name)}
                          disabled={addingToCart === medicine._id}
                          className="cursor-pointer"
                        >
                          {addingToCart === medicine._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      );
                    })()}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center pt-6"
            >
              <Button
                variant="outline"
                size="lg"
                onClick={() => setDisplayLimit(prev => prev + 20)}
                className="min-w-[200px]"
              >
                Load More Medicines
              </Button>
            </motion.div>
          )}
        </>
      )}

      {/* Medicine Details Modal */}
      <Dialog open={!!selectedMedicineId} onOpenChange={(open) => !open && setSelectedMedicineId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedMedicine?.name}</DialogTitle>
            <DialogDescription>
              Complete information about this medicine
            </DialogDescription>
          </DialogHeader>
          {selectedMedicine && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {selectedMedicine.category}
                </Badge>
                <Badge variant={selectedMedicine.inStock ? "default" : "destructive"}>
                  {selectedMedicine.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Description</h4>
                  <p className="text-base">{selectedMedicine.description}</p>
                </div>
                {selectedMedicine.dosage && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Dosage</h4>
                    <p className="text-base">{selectedMedicine.dosage}</p>
                  </div>
                )}
                {selectedMedicine.manufacturer && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Manufacturer</h4>
                    <p className="text-base">{selectedMedicine.manufacturer}</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Price</h4>
                      <p className="text-3xl font-bold text-primary">₹{selectedMedicine.price}</p>
                    </div>
                  </div>
                  {(() => {
                    const cartItem = getCartItem(selectedMedicine._id);
                    const isUpdating = updatingCart === cartItem?._id;
                    
                    if (cartItem) {
                      return (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-muted rounded-lg p-2 flex-1 justify-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleUpdateQuantity(cartItem._id, cartItem.quantity, -1, selectedMedicine.name)}
                              disabled={isUpdating}
                            >
                              <Minus className="h-5 w-5" />
                            </Button>
                            <span className="font-bold text-xl min-w-[3ch] text-center">
                              {isUpdating ? <Loader2 className="h-5 w-5 animate-spin inline" /> : cartItem.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleUpdateQuantity(cartItem._id, cartItem.quantity, 1, selectedMedicine.name)}
                              disabled={isUpdating}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setSelectedMedicineId(null)}
                            className="flex-1"
                          >
                            Done
                          </Button>
                        </div>
                      );
                    }
                    
                    return (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          handleAddToCart(selectedMedicine._id, selectedMedicine.name);
                          setSelectedMedicineId(null);
                        }}
                        disabled={!selectedMedicine.inStock || addingToCart === selectedMedicine._id}
                      >
                        {addingToCart === selectedMedicine._id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding to Cart...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}