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

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking" | "cod">("upi");
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
    if (!formData.deliveryAddress || !formData.deliveryCity || !formData.deliveryState || !formData.deliveryZipCode || !formData.phone) {
      toast.error("Please fill in all address fields");
      return;
    }

    if (!formData.phone) {
      toast.error("Please provide a phone number");
      return;
    }

    // Prevent multiple submissions
    if (isProcessing) {
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
        deliveryType: "drone",
        deliveryAddress: {
          street: formData.deliveryAddress,
          city: formData.deliveryCity,
          state: formData.deliveryState,
          zipCode: formData.deliveryZipCode,
          latitude: 12.9716, // Default Bangalore coordinates
          longitude: 77.5946,
        },
        phone: formData.phone,
      });

      // Handle payment based on method
      if (paymentMethod === "cod") {
        // For COD, just clear cart and redirect to orders
        await clearCart();
        toast.success("Order placed successfully! Pay cash on delivery.");
        navigate(`/order-tracking/${orderId}`);
      } else {
        // Initiate payment via PhonePe for online payments
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
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
    // Note: Don't reset isProcessing on success as we're navigating away
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
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    Drone Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Fast delivery in 10 minutes • FREE
                  </p>
                </CardContent>
              </Card>

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
                      <select
                        id="state"
                        required
                        value={formData.deliveryState}
                        onChange={(e) => setFormData({ ...formData, deliveryState: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select State</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                        <option value="Ladakh">Ladakh</option>
                        <option value="Lakshadweep">Lakshadweep</option>
                        <option value="Puducherry">Puducherry</option>
                      </select>
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your preferred payment method
                  </p>
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Smartphone className="h-5 w-5 text-primary" />
                          <span className="font-bold">UPI Payment</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Pay using PhonePe, Google Pay, Paytm, or any UPI app
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <span className="font-bold">Credit/Debit Card</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Visa, Mastercard, RuPay - Secure payment via PhonePe
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="netbanking" id="netbanking" />
                      <Label htmlFor="netbanking" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <span className="font-bold">Net Banking</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          All major banks supported via PhonePe gateway
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Store className="h-5 w-5 text-primary" />
                          <span className="font-bold">Cash on Delivery</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Pay with cash when your order is delivered
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      🔒 Online payments are secured and processed through PhonePe payment gateway
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
                        {paymentMethod === "cod" ? "Placing Order..." : "Initiating Payment..."}
                      </>
                    ) : (
                      <>
                        {paymentMethod === "cod" ? (
                          <>
                            <Store className="h-4 w-4 mr-2" />
                            Place Order (COD)
                          </>
                        ) : (
                          <>
                            <Smartphone className="h-4 w-4 mr-2" />
                            Proceed to Pay ₹{totalPrice.toFixed(2)}
                          </>
                        )}
                      </>
                    )}
                  </Button>
                  {paymentMethod !== "cod" && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      You will be redirected to PhonePe for secure payment
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}