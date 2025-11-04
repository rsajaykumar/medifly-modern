import { useState, useEffect } from "react";

export function useGeolocation() {
  const [transcriptedLocation, setTranscriptedLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // For now, we'll use a placeholder location
            // In production, you would use a reverse geocoding API
            setTranscriptedLocation("Bangalore, India");
          } catch (error) {
            console.error("Error getting location:", error);
            setTranscriptedLocation("Location unavailable");
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setTranscriptedLocation("Location unavailable");
          setLoading(false);
        }
      );
    } else {
      setTranscriptedLocation("Location unavailable");
      setLoading(false);
    }
  }, []);

  return { transcriptedLocation, loading };
}
