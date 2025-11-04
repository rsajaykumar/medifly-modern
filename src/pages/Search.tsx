import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plane, Calendar, MapPin, Loader2, Search as SearchIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function Search() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedFlight, setSelectedFlight] = useState<Id<"flights"> | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  const flights = useQuery(
    api.flights.list,
    origin || destination ? { origin: origin || undefined, destination: destination || undefined } : {}
  );
  const createBooking = useMutation(api.bookings.create);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFlight) return;

    const formData = new FormData(e.currentTarget);
    
    try {
      await createBooking({
        flightId: selectedFlight,
        patientName: formData.get("patientName") as string,
        patientAge: parseInt(formData.get("patientAge") as string),
        medicalCondition: formData.get("medicalCondition") as string,
        emergencyContact: formData.get("emergencyContact") as string,
        specialRequirements: formData.get("specialRequirements") as string || undefined,
        numberOfSeats: 1,
      });

      toast.success("Booking confirmed successfully!");
      setBookingDialogOpen(false);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create booking");
    }
  };

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
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              My Bookings
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight mb-8">Search Medical Flights</h1>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    placeholder="e.g., New York"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Los Angeles"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {flights === undefined ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : flights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No flights found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {flights.map((flight, index) => (
                <motion.div
                  key={flight._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">
                            {flight.origin} → {flight.destination}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            Flight {flight.flightNumber} • {flight.aircraftType}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">${flight.pricePerSeat.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">per seat</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Departure</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(flight.departureTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Arrival</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(flight.arrivalTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Available Seats</p>
                            <p className="text-sm text-muted-foreground">{flight.availableSeats}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Medical Equipment</p>
                        <div className="flex flex-wrap gap-2">
                          {flight.medicalEquipment.map((equipment) => (
                            <span
                              key={equipment}
                              className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                            >
                              {equipment}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedFlight(flight._id);
                          setBookingDialogOpen(true);
                        }}
                        className="w-full"
                      >
                        Book Flight
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
            <DialogDescription>
              Please provide patient information to complete the booking
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBooking} className="space-y-4">
            <div>
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input id="patientName" name="patientName" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="patientAge">Patient Age *</Label>
              <Input id="patientAge" name="patientAge" type="number" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="medicalCondition">Medical Condition *</Label>
              <Textarea id="medicalCondition" name="medicalCondition" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact *</Label>
              <Input id="emergencyContact" name="emergencyContact" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="specialRequirements">Special Requirements</Label>
              <Textarea id="specialRequirements" name="specialRequirements" className="mt-2" />
            </div>
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Confirm Booking
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
