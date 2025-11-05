import { useState, useEffect, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useGeolocation() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [transcriptedLocation, setTranscriptedLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationSource, setLocationSource] = useState<"gps" | "ip" | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const getCurrentLocation = useAction(api.ipLocation.getCurrentLocation);

  // Try IP-based location first for better accuracy
  const tryIPLocation = async () => {
    try {
      const ipLocation = await getCurrentLocation({});
      
      if (ipLocation && ipLocation.latitude && ipLocation.longitude) {
        setLatitude(ipLocation.latitude);
        setLongitude(ipLocation.longitude);
        setAccuracy(ipLocation.accuracy);
        setTranscriptedLocation(`${ipLocation.city}, ${ipLocation.country}`);
        setLocationSource("ip");
        setLoading(false);
        setError(null);
        console.log(`IP-based location: ${ipLocation.city}, ${ipLocation.country} (±${ipLocation.accuracy}m)`);
        return true;
      }
    } catch (err) {
      console.warn("IP location failed, will try GPS:", err);
    }
    return false;
  };

  const requestPermission = async () => {
    setLoading(true);
    setError(null);
    
    // Try IP-based location first
    const ipSuccess = await tryIPLocation();
    
    // If IP location succeeded, still try GPS for more precision
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Only update if GPS is more accurate than IP location
          const gpsAccuracy = position.coords.accuracy;
          const shouldUseGPS = !ipSuccess || (accuracy && gpsAccuracy < accuracy);
          
          if (shouldUseGPS) {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
            setHeading(position.coords.heading);
            setAccuracy(position.coords.accuracy);
            setLocationSource("gps");
            console.log(`GPS location accuracy: ±${Math.round(position.coords.accuracy)}m`);
          }
          
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error("GPS error:", error);
          
          // If GPS fails but we have IP location, that's fine
          if (ipSuccess) {
            console.log("Using IP-based location as GPS failed");
            return;
          }
          
          let errorMessage = "Location unavailable";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Using IP-based location.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "GPS unavailable. Using IP-based location.";
              break;
            case error.TIMEOUT:
              errorMessage = "GPS timeout. Using IP-based location.";
              break;
          }
          
          setError(errorMessage);
          
          // Fallback to Bangalore if both IP and GPS fail
          if (!ipSuccess) {
            setTranscriptedLocation("Bangalore, India (Default)");
            setLatitude(12.9716);
            setLongitude(77.5946);
            setLocationSource(null);
          }
          
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } else if (!ipSuccess) {
      // No geolocation support and IP failed
      setError("Geolocation not supported");
      setTranscriptedLocation("Bangalore, India (Default)");
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
          setLocationSource("gps");
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
    locationSource,
    requestPermission,
    startTracking,
    stopTracking,
  };
}