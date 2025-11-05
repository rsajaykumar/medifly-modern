import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Package, ArrowLeft, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function Orders() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const orders = useQuery(api.orders.list);
  const cancelOrder = useMutation(api.orders.cancel);
  const clearAllOrders = useMutation(api.orders.clearAll);
  const [cancellingOrderId, setCancellingOrderId] = useState<Id<"orders"> | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleCancelOrder = async (orderId: Id<"orders">) => {
    setCancellingOrderId(orderId);
    try {
      await cancelOrder({ orderId });
      toast.success("Order cancelled successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleClearAllOrders = async () => {
    setIsClearingAll(true);
    try {
      const result = await clearAllOrders({});
      toast.success(`Cleared ${result.deletedCount} order${result.deletedCount !== 1 ? 's' : ''}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to clear orders");
    } finally {
      setIsClearingAll(false);
    }
  };

  if (isLoading || !orders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "picked_up":
        return "bg-green-500/10 text-green-600";
      case "in_flight":
      case "ready_for_pickup":
        return "bg-blue-500/10 text-blue-600";
      case "cancelled":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-yellow-500/10 text-yellow-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
            {orders && orders.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isClearingAll}
                  >
                    {isClearingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Clear All Orders
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-[425px] border-2 shadow-2xl">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <AlertDialogHeader className="space-y-3">
                      <motion.div
                        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/20"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <X className="h-6 w-6 text-destructive" />
                      </motion.div>
                      <AlertDialogTitle className="text-center text-xl font-bold">
                        Clear All Orders?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-center text-base">
                        Are you sure you want to clear all <span className="font-semibold text-foreground">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>? This action cannot be undone and will permanently delete your order history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:space-x-2 gap-2 sm:gap-0">
                      <AlertDialogCancel className="sm:flex-1 transition-all duration-200 hover:scale-105 hover:shadow-md">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAllOrders}
                        className="sm:flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        Yes, Clear All Orders
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </motion.div>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">No orders yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start shopping to see your orders here
                </p>
                <Button onClick={() => navigate("/dashboard")}>
                  Browse Medicines
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const canCancel = order.status === "pending" || order.status === "confirmed";
                
                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Order #{order._id.slice(-8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order._creationTime).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {order.deliveryType === "drone" ? "Drone" : "Pickup"}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>
                                {item.medicineName} × {item.quantity}
                              </span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <span className="text-sm text-muted-foreground">Total: </span>
                            <span className="text-lg font-bold">₹{order.totalPrice || order.totalAmount}</span>
                          </div>
                          <div className="flex gap-2">
                            {order.deliveryType === "drone" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => navigate(`/orders/${order._id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Track Order
                              </Button>
                            )}
                            {canCancel && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={cancellingOrderId === order._id}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="sm:max-w-[425px] border-2 shadow-2xl">
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                  >
                                    <AlertDialogHeader className="space-y-3">
                                      <motion.div
                                        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/20"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                                      >
                                        <X className="h-6 w-6 text-destructive" />
                                      </motion.div>
                                      <AlertDialogTitle className="text-center text-xl font-bold">
                                        Cancel Order?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-center text-base">
                                        Are you sure you want to cancel order <span className="font-semibold text-foreground">#{order._id.slice(-8)}</span>? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="sm:space-x-2 gap-2 sm:gap-0">
                                      <AlertDialogCancel className="sm:flex-1 transition-all duration-200 hover:scale-105 hover:shadow-md">
                                        No, Keep Order
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleCancelOrder(order._id)}
                                        className="sm:flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                                      >
                                        Yes, Cancel Order
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </motion.div>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}