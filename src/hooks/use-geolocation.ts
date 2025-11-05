import { useState, useEffect, useRef } from "react";

export function useGeolocation() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [transcriptedLocation, setTranscriptedLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const requestPermission = () => {
    setLoading(true);
    setError(null);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setHeading(position.coords.heading);
          setAccuracy(position.coords.accuracy);
          setTranscriptedLocation("Current Location");
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError(error.message);
          setTranscriptedLocation("Location unavailable");
          // Fallback to Bangalore coordinates
          setLatitude(12.9716);
          setLongitude(77.5946);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
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

  const startTracking = () => {
    if ("geolocation" in navigator && !watchIdRef.current) {
      setIsTracking(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setHeading(position.coords.heading);
          setAccuracy(position.coords.accuracy);
          setTranscriptedLocation("Bangalore, India");
          setError(null);
        },
        (error) => {
          console.error("Tracking error:", error);
          setError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
    }
  };

  useEffect(() => {
    requestPermission();
    
    return () => {
      stopTracking();
    };
  }, []);

  return { 
    latitude, 
    longitude, 
    heading,
    accuracy,
    transcriptedLocation, 
    loading, 
    error,
    isTracking,
    requestPermission,
    startTracking,
    stopTracking,
  };
}