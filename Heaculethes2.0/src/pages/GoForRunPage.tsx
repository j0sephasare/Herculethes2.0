// src/pages/GoForRunPage.tsx

/* global google */
declare const google: any;

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

/* ----------------------------- Types & utils ----------------------------- */

type RunState = "idle" | "running" | "paused" | "finished";
type LatLng = { lat: number; lon: number; timestamp: number; acc?: number };

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// Haversine distance in meters
function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371_000;
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

function formatClock(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

/* ------------------------------ Map styling ----------------------------- */

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b1220" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1220" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9aa4b2" }] },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c7b28a" }],
  },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#111a2c" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a2742" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1529" }] },
];

/* --------------------------------- Page ---------------------------------- */

export default function GoForRunPage() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [runState, setRunState] = useState<RunState>("idle");
  const [targetDistanceKm, setTargetDistanceKm] = useState(5); // default 5k

  const [totalDistanceM, setTotalDistanceM] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [gpsQuality, setGpsQuality] = useState<"good" | "ok" | "poor">("ok");

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const userMarkerRef = useRef<any | null>(null);
  const pathPolylineRef = useRef<any | null>(null);

  const initialPointRef = useRef<LatLng | null>(null);
  const lastPointRef = useRef<LatLng | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const runStartEpochRef = useRef<number | null>(null);

  /* -------------------------- Load Google Maps --------------------------- */
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

  /* ---------------------- Prime map with first fix ----------------------- */
  useEffect(() => {
    if (!mapsLoaded || !mapDivRef.current) return;
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const acc = pos.coords.accuracy ?? undefined;
        const p: LatLng = { lat, lon, timestamp: pos.timestamp, acc };
        initialPointRef.current = p;
        lastPointRef.current = p;

        // GPS quality hint 
        setGpsQuality(acc && acc > 40 ? "poor" : acc && acc > 20 ? "ok" : "good");

        const center = { lat, lng: lon };
        mapRef.current = new google.maps.Map(mapDivRef.current, {
          center,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
          styles: DARK_MAP_STYLE,
          gestureHandling: "greedy",
        });

        userMarkerRef.current = new google.maps.Marker({
          position: center,
          map: mapRef.current,
          title: "Your location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#fbbf24", // amber-400
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
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
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [mapsLoaded]);

  /* ------------------------------- Timer --------------------------------- */
  useEffect(() => {
    if (runState !== "running") {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (timerRef.current == null && runStartEpochRef.current != null) {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        setElapsedMs(now - (runStartEpochRef.current ?? now));
      }, 1000);
    }
    return () => {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [runState]);

  /* --------------------------- Start GPS watch --------------------------- */
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
          acc: pos.coords.accuracy ?? undefined,
        };

        // Update quality hint
        const acc = newPoint.acc ?? 30;
        setGpsQuality(acc > 40 ? "poor" : acc > 20 ? "ok" : "good");

        // Simple sanity checks to reduce “GPS jumps”
        const prev = lastPointRef.current;
        if (prev) {
          const dt = (newPoint.timestamp - prev.timestamp) / 1000; // s
          const step = distanceMeters(prev, newPoint); // m
          const speed = dt > 0 ? step / dt : 0; // m/s

          // Ignore huge jumps / very inaccurate fixes
          if (acc > 60 || step > 60 || speed > 8) {
            // likely a glitch — skip
            return;
          }

          setTotalDistanceM((d) => d + step);
        }

        lastPointRef.current = newPoint;

        // Map updates
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
              strokeColor: "#22c55e", // emerald-500
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
        timeout: 12000,
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

  /* ------------------------------ Controls ------------------------------- */
  const handleStart = () => {
    if (!initialPointRef.current) return;

    // reset
    setTotalDistanceM(0);
    setElapsedMs(0);
    runStartEpochRef.current = Date.now();
    lastPointRef.current = initialPointRef.current;

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
    runStartEpochRef.current = Date.now() - elapsedMs;
    setRunState("running");
    startWatch();
  };

  const handleStop = () => {
    stopWatch();
    setRunState("finished");
    // small finish buzz if supported
    if (navigator.vibrate) navigator.vibrate(120);
  };

  const handleReset = () => {
    stopWatch();
    setRunState("idle");
    setTotalDistanceM(0);
    setElapsedMs(0);
    runStartEpochRef.current = null;

    if (pathPolylineRef.current) {
      pathPolylineRef.current.setMap(null);
      pathPolylineRef.current = null;
    }
  };

  const recenter = () => {
    const p = lastPointRef.current || initialPointRef.current;
    if (!p || !mapRef.current) return;
    mapRef.current.panTo(new google.maps.LatLng(p.lat, p.lon));
  };

  /* ------------------------- Auto-stop on target ------------------------- */
  const targetMeters = targetDistanceKm * 1000;
  useEffect(() => {
    if (runState === "running" && totalDistanceM >= targetMeters && targetMeters > 0) {
      handleStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDistanceM, targetMeters, runState]);

  /* ---------------------------- Derived values --------------------------- */
  const progress = Math.min(totalDistanceM / Math.max(targetMeters, 1), 1);

  const gpsBadge = useMemo(() => {
    if (gpsQuality === "good")
      return <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300">GPS: Good</span>;
    if (gpsQuality === "ok")
      return <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300">GPS: Fair</span>;
    return <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/15 border border-red-400/40 text-red-300">GPS: Poor</span>;
  }, [gpsQuality]);

  const mapGlow: CSSProperties =
    runState === "running"
      ? { boxShadow: "0 0 0 1px rgba(251,191,36,0.35), 0 0 36px rgba(251,191,36,0.15)" }
      : {};

  /* --------------------------------- JSX --------------------------------- */

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Header */}
      <header className="px-4 pt-5 pb-4 border-b border-yellow-400/20 bg-slate-950/90">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-400/20 border border-yellow-400/30 flex items-center justify-center text-lg">
            🏃‍♂️
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Go for a run</h1>
            <p className="text-sm text-slate-400">Pick a distance, then track your route, pace and time.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status / errors */}
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

        {/* Map */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden" style={mapGlow}>
          <div
            ref={mapDivRef}
            className="w-full h-72 bg-slate-900 flex items-center justify-center text-xs text-slate-400"
          >
            {!mapsLoaded && !mapsError && <span>Loading map…</span>}
          </div>
        </section>

        {/* Controls & stats */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4">
          {/* Top row: target + GPS + recenter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[11px] text-slate-400">Target distance</p>
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
              {gpsBadge}
            </div>

            <button
              onClick={recenter}
              className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-slate-600"
            >
              Recenter map
            </button>
          </div>

          {/* Metrics + progress ring */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            {/* Progress ring */}
            <div className="col-span-2 md:col-span-1 flex items-center justify-center">
              <ProgressRing progress={progress} label={`${Math.round(progress * 100)}%`} />
            </div>

            <Stat label="Distance" value={`${(totalDistanceM / 1000).toFixed(2)} km`} />
            <Stat label="Time" value={formatClock(elapsedMs)} />
            <Stat label="Pace (min/km)" value={formatPace(elapsedMs, totalDistanceM)} />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            {runState === "idle" && (
              <button
                onClick={handleStart}
                disabled={!mapsLoaded || !initialPointRef.current}
                className="flex-1 min-w-[120px] py-2 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-500 active:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
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
              Run finished — distance{" "}
              <span className="font-semibold">{(totalDistanceM / 1000).toFixed(2)} km</span>, time{" "}
              <span className="font-semibold">{formatClock(elapsedMs)}</span>, pace{" "}
              <span className="font-semibold">{formatPace(elapsedMs, totalDistanceM)} /km</span>.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

/* ------------------------------ Subcomponents ---------------------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
      <p className="uppercase tracking-wide text-[10px] text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function ProgressRing({ progress, label }: { progress: number; label: string }) {
  const size = 96;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, progress)) * c;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#1f2a44" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#fbbf24"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${dash} ${c - dash}`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-slate-200 text-xs rotate-[90deg]"
      >
        {label}
      </text>
    </svg>
  );
}
