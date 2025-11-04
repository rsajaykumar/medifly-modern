import { useState, useEffect } from "react";

export function useGeolocation() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [transcriptedLocation, setTranscriptedLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = () => {
    setLoading(true);
    setError(null);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setTranscriptedLocation("Bangalore, India");
          setLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError(error.message);
          setTranscriptedLocation("Location unavailable");
          // Fallback to Bangalore coordinates
          setLatitude(12.9716);
          setLongitude(77.5946);
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported");
      setTranscriptedLocation("Location unavailable");
      setLatitude(12.9716);
      setLongitude(77.5946);
      setLoading(false);
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  return { 
    latitude, 
    longitude, 
    transcriptedLocation, 
    loading, 
    error,
    requestPermission 
  };
}