// src/pages/GoForRunPage.tsx

/* global google */
declare const google: any;

import { useEffect, useRef, useState, type CSSProperties } from "react";

// Small helpers
type RunState = "idle" | "running" | "paused" | "finished";
type LatLng = { lat: number; lon: number; timestamp: number };

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// Haversine distance in meters
function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371_000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(
        sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
      ),
      Math.sqrt(
        1 - (sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon)
      )
    );

  return R * c;
}

function formatTime(ms: number): string {
  if (ms <= 0) return "00:00";
  let totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatPace(ms: number, distanceM: number): string {
  const km = distanceM / 1000;
  if (!km || ms <= 0) return "--:--";
  const paceSecPerKm = ms / 1000 / km;
  const minutes = Math.floor(paceSecPerKm / 60);
  const seconds = Math.round(paceSecPerKm % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export default function GoForRunPage() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);

  const [runState, setRunState] = useState<RunState>("idle");
  const [targetDistanceKm, setTargetDistanceKm] = useState(5); // default 5k

  const [totalDistanceM, setTotalDistanceM] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [initialLocation, setInitialLocation] = useState<LatLng | null>(null);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const userMarkerRef = useRef<any | null>(null);
  const pathPolylineRef = useRef<any | null>(null);

  const lastPointRef = useRef<LatLng | null>(null); // NEW: track only the last point
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const runStartTimeRef = useRef<number | null>(null);

  // --- Load Google Maps JS once ---
  useEffect(() => {
    if (!apiKey) {
      setMapsError(
        "Google Maps API key missing. Add VITE_GOOGLE_MAPS_API_KEY to your .env.local."
      );
      return;
    }

    if ((window as any).google?.maps) {
      setMapsLoaded(true);
      return;
    }

    if (document.getElementById("gmaps-script")) return;

    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => setMapsLoaded(true);
    script.onerror = () => setMapsError("Failed to load Google Maps script.");

    document.body.appendChild(script);
  }, [apiKey]);

  // --- Get initial location and create map ---
  useEffect(() => {
    if (!mapsLoaded) return;
    if (!mapDivRef.current) return;
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const location: LatLng = { lat, lon, timestamp: pos.timestamp };
        setInitialLocation(location);
        lastPointRef.current = location;

        const center = { lat, lng: lon };

        mapRef.current = new google.maps.Map(mapDivRef.current, {
          center,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
        });

        userMarkerRef.current = new google.maps.Marker({
          position: center,
          map: mapRef.current,
          title: "Your location",
        });
      },
      (err) => {
        console.error(err);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it in browser settings."
            : "Failed to get your location."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [mapsLoaded]);

  // --- Timer effect ---
  useEffect(() => {
    if (runState !== "running") {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timerRef.current == null && runStartTimeRef.current != null) {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        setElapsedMs(now - (runStartTimeRef.current ?? now));
      }, 1000);
    }

    return () => {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [runState]);

  // --- Start/Stop GPS watch ---
  const startWatch = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newPoint: LatLng = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          timestamp: pos.timestamp,
        };

        // distance increment from last point
        const prev = lastPointRef.current;
        if (prev) {
          const inc = distanceMeters(prev, newPoint);
          setTotalDistanceM((d) => d + inc);
        }
        lastPointRef.current = newPoint;

        // Update map / polyline
        if (mapRef.current) {
          const latLng = new google.maps.LatLng(newPoint.lat, newPoint.lon);
          mapRef.current.panTo(latLng);

          if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(latLng);
          }

          if (!pathPolylineRef.current) {
            pathPolylineRef.current = new google.maps.Polyline({
              path: [latLng],
              geodesic: true,
              strokeColor: "#22c55e",
              strokeOpacity: 1.0,
              strokeWeight: 4,
              map: mapRef.current,
            });
          } else {
            pathPolylineRef.current.getPath().push(latLng);
          }
        }
      },
      (err) => {
        console.error(err);
        setLocationError("Error while tracking location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    watchIdRef.current = id;
  };

  const stopWatch = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // --- Run controls ---
  const handleStart = () => {
    if (!initialLocation) return;

    // Reset metrics
    setTotalDistanceM(0);
    setElapsedMs(0);
    runStartTimeRef.current = Date.now();
    lastPointRef.current = initialLocation;

    // Reset polyline
    if (pathPolylineRef.current) {
      pathPolylineRef.current.setMap(null);
      pathPolylineRef.current = null;
    }

    setRunState("running");
    startWatch();
  };

  const handlePause = () => {
    if (runState !== "running") return;
    setRunState("paused");
    stopWatch();
  };

  const handleResume = () => {
    if (runState !== "paused") return;
    runStartTimeRef.current = Date.now() - elapsedMs;
    setRunState("running");
    startWatch();
  };

  const handleStop = () => {
    stopWatch();
    setRunState("finished");
  };

  const handleReset = () => {
    stopWatch();
    setRunState("idle");
    setTotalDistanceM(0);
    setElapsedMs(0);
    runStartTimeRef.current = null;
    lastPointRef.current = null;

    if (pathPolylineRef.current) {
      pathPolylineRef.current.setMap(null);
      pathPolylineRef.current = null;
    }
  };

  const targetMeters = targetDistanceKm * 1000;
  const remainingM = Math.max(targetMeters - totalDistanceM, 0);

  // faint radial highlight over map when running
  const mapOverlayStyle: CSSProperties =
    runState === "running"
      ? {
          boxShadow:
            "0 0 0 1px rgba(34,197,94,0.4), 0 0 40px rgba(34,197,94,0.25)",
        }
      : {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Go for a run</h1>
        <p className="text-sm text-slate-400">
          Pick a distance, then track your route, pace and time.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {mapsError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {mapsError}
          </div>
        )}

        {locationError && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/40 px-3 py-2 text-xs text-amber-200">
            {locationError}
          </div>
        )}

        {/* Map card */}
        <section
          className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden"
          style={mapOverlayStyle}
        >
          <div
            ref={mapDivRef}
            className="w-full h-72 bg-slate-900 flex items-center justify-center text-xs text-slate-400"
          >
            {!mapsLoaded && !mapsError && <span>Loading map…</span>}
          </div>
        </section>

        {/* Controls & stats */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4">
          {/* Distance selector */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">Target distance</p>
              <select
                value={targetDistanceKm}
                onChange={(e) => setTargetDistanceKm(Number(e.target.value))}
                className="mt-1 text-sm bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100"
                disabled={runState === "running" || runState === "paused"}
              >
                <option value={2}>2 km (easy)</option>
                <option value={3}>3 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400">Distance</p>
                <p className="text-sm font-semibold">
                  {(totalDistanceM / 1000).toFixed(2)} km
                </p>
              </div>
              <div>
                <p className="text-slate-400">Remaining</p>
                <p className="text-sm font-semibold">
                  {(remainingM / 1000).toFixed(2)} km
                </p>
              </div>
              <div>
                <p className="text-slate-400">Time</p>
                <p className="text-sm font-semibold">{formatTime(elapsedMs)}</p>
              </div>
              <div>
                <p className="text-slate-400">Pace (min/km)</p>
                <p className="text-sm font-semibold">
                  {formatPace(elapsedMs, totalDistanceM)}
                </p>
              </div>
            </div>
          </div>

          {/* Run controls */}
          <div className="flex flex-wrap gap-2">
            {runState === "idle" && (
              <button
                onClick={handleStart}
                disabled={!initialLocation || !mapsLoaded}
                className="flex-1 min-w-[120px] py-2 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-500 active:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="text-lg">🏃‍♂️</span>
                <span>Start run</span>
              </button>
            )}

            {runState === "running" && (
              <>
                <button
                  onClick={handlePause}
                  className="flex-1 min-w-[120px] py-2 rounded-xl bg-amber-500 text-sm font-semibold hover:bg-amber-400 active:bg-amber-600 transition"
                >
                  Pause
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 min-w-[120px] py-2 rounded-xl bg-slate-700 text-sm font-semibold hover:bg-slate-600 active:bg-slate-800 transition"
                >
                  Stop
                </button>
              </>
            )}

            {runState === "paused" && (
              <>
                <button
                  onClick={handleResume}
                  className="flex-1 min-w-[120px] py-2 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-500 active:bg-emerald-700 transition"
                >
                  Resume
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 min-w-[120px] py-2 rounded-xl bg-slate-700 text-sm font-semibold hover:bg-slate-600 active:bg-slate-800 transition"
                >
                  Stop
                </button>
              </>
            )}

            {runState === "finished" && (
              <button
                onClick={handleReset}
                className="flex-1 min-w-[120px] py-2 rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-500 active:bg-blue-700 transition"
              >
                Reset
              </button>
            )}
          </div>

          {runState === "finished" && (
            <p className="text-xs text-slate-400">
              Run finished – distance{" "}
              <span className="font-semibold">
                {(totalDistanceM / 1000).toFixed(2)} km
              </span>
              , time <span className="font-semibold">{formatTime(elapsedMs)}</span>, pace{" "}
              <span className="font-semibold">
                {formatPace(elapsedMs, totalDistanceM)} /km
              </span>
              .
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
