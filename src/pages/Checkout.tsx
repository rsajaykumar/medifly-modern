import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, MapPin, Plane, Store, CreditCard, ArrowLeft, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Checkout() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.list);
  const createOrder = useMutation(api.orders.create);
  const clearCart = useMutation(api.cart.clear);
  const initiatePayment = useAction(api.phonepe.initiatePayment);

  const [deliveryType, setDeliveryType] = useState<"drone" | "pickup">("drone");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryZipCode: "",
    phone: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const isGuestMode = localStorage.getItem("medifly_guest_mode") === "true";
    
    // Block guest users from accessing checkout
    if (!isLoading && !isAuthenticated) {
      if (isGuestMode) {
        toast.error("Please sign in to place an order", {
          description: "Guest users cannot checkout",
          duration: 4000,
        });
      }
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        deliveryAddress: user.address || "",
        deliveryCity: user.city || "",
        deliveryState: user.state || "",
        deliveryZipCode: user.zipCode || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (cartItems && cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  if (isLoading || !cartItems) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.medicine?.price || 0) * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (deliveryType === "drone") {
      if (!formData.deliveryAddress || !formData.deliveryCity || !formData.deliveryState || !formData.deliveryZipCode || !formData.phone) {
        toast.error("Please fill in all address fields");
        return;
      }
    }

    if (!formData.phone) {
      toast.error("Please provide a phone number");
      return;
    }

    setIsProcessing(true);
    try {
      const items = cartItems.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.medicine?.name || "",
        quantity: item.quantity,
        price: item.medicine?.price || 0,
      }));

      // Create order first
      const orderId = await createOrder({
        items,
        totalAmount: totalPrice,
        deliveryType,
        deliveryAddress: deliveryType === "drone" ? {
          street: formData.deliveryAddress,
          city: formData.deliveryCity,
          state: formData.deliveryState,
          zipCode: formData.deliveryZipCode,
          latitude: 12.9716, // Default Bangalore coordinates
          longitude: 77.5946,
        } : undefined,
        phone: formData.phone,
      });

      // Initiate UPI payment via PhonePe
      const paymentResult = await initiatePayment({
        orderId,
        amount: totalPrice,
        userId: user?._id || "",
        userPhone: formData.phone,
      });

      if (paymentResult.success && paymentResult.paymentUrl) {
        // Clear cart before redirecting to payment
        await clearCart();
        
        toast.success("Redirecting to payment gateway...");
        
        // Redirect to PhonePe payment page
        window.location.href = paymentResult.paymentUrl;
      } else {
        throw new Error(paymentResult.error || "Payment initiation failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src="/logo.svg" alt="Medifly" className="h-8 w-8" />
              <span className="text-xl font-semibold">Medifly</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" onClick={() => navigate("/orders")} className="hidden sm:inline-flex">
                Orders
              </Button>
              <Button variant="ghost" onClick={() => navigate("/profile")} className="hidden sm:inline-flex">
                Profile
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/cart")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={deliveryType} onValueChange={(value: any) => setDeliveryType(value)}>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="drone" id="drone" />
                      <Label htmlFor="drone" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Plane className="h-5 w-5 text-primary" />
                          <span className="font-bold">Drone Delivery</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Fast delivery in 10 minutes • FREE
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Store className="h-5 w-5 text-primary" />
                          <span className="font-bold">Pharmacy Pickup</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Pick up from nearby pharmacy • FREE
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {deliveryType === "drone" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        required
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          required
                          value={formData.deliveryCity}
                          onChange={(e) => setFormData({ ...formData, deliveryCity: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          required
                          value={formData.deliveryState}
                          onChange={(e) => setFormData({ ...formData, deliveryState: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        required
                        value={formData.deliveryZipCode}
                        onChange={(e) => setFormData({ ...formData, deliveryZipCode: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {deliveryType === "pickup" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Pharmacy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/nearby-stores")}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View Nearby Pharmacies
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Secure UPI payment via PhonePe
                  </p>
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <div className="flex items-start space-x-3 p-4 border-2 border-primary rounded-lg bg-primary/5">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Smartphone className="h-5 w-5 text-primary" />
                          <span className="font-bold">UPI Payment</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Pay securely using PhonePe, Google Pay, Paytm, or any UPI app
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      🔒 Your payment is secured by PhonePe. You'll be redirected to complete the payment.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item._id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.medicine?.name} × {item.quantity}
                        </span>
                        <span>₹{((item.medicine?.price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Initiating Payment...
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-4 w-4 mr-2" />
                        Proceed to Pay ₹{totalPrice.toFixed(2)}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    You will be redirected to PhonePe for secure payment
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}