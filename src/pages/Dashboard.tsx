import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const orders = useQuery(api.orders.list);
  const cartItems = useQuery(api.cart.list);
  const removeFromCart = useMutation(api.cart.remove);
  const updateQuantity = useMutation(api.cart.updateQuantity);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleRemoveFromCart = async (cartItemId: string) => {
    try {
      await removeFromCart({ cartItemId: cartItemId as any });
      toast.success("Removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      await updateQuantity({ cartItemId: cartItemId as any, quantity });
    } catch (error) {
      toast.error("Failed to update quantity");
    }
  };

  const cartTotal = cartItems?.reduce((sum, item) => {
    return sum + (item.medicine?.price || 0) * item.quantity;
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src="/logo.svg" alt="Medifly" className="h-8 w-8" />
              <span className="text-xl font-semibold">Medifly</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Cart & Orders</h1>
              <p className="text-muted-foreground mt-2">Manage your medicine orders</p>
            </div>
            <Button onClick={() => navigate("/search")} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Browse Medicines
            </Button>
          </div>

          {/* Cart Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
            {cartItems === undefined ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : cartItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-6">Add medicines to get started</p>
                  <Button onClick={() => navigate("/search")}>
                    Browse Medicines
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img 
                            src={item.medicine?.imageUrl} 
                            alt={item.medicine?.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div>
                            <h3 className="font-semibold">{item.medicine?.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.medicine?.dosage}</p>
                            <p className="text-lg font-bold mt-1">₹{item.medicine?.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item._id, Math.max(1, item.quantity - 1))}
                            >
                              -
                            </Button>
                            <span className="w-12 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveFromCart(item._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold">Total:</span>
                      <span className="text-2xl font-bold">₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => navigate("/checkout")}
                    >
                      Proceed to Checkout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Orders Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Order History</h2>
            {orders === undefined ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">Your order history will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {orders.map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">
                              Order #{order._id.slice(-8)}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {new Date(order._creationTime).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === "delivered" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.medicineName} x{item.quantity}</span>
                              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Total:</span>
                            <span className="text-xl font-bold">₹{order.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}