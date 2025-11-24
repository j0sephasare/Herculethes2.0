// src/pages/GymsNearMePage.tsx

// Tell TS that "google" will exist once the script is loaded
declare const google: any;

import { useEffect, useMemo, useRef, useState } from "react";

/* -------------------------------- Types ---------------------------------- */

type Gym = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  address?: string;
};

type LocationState =
  | { status: "idle" }
  | { status: "getting" }
  | { status: "got"; lat: number; lon: number }
  | { status: "error"; message: string };

/* ------------------------------ Utils ------------------------------------ */

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// Haversine distance in km
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* -------------------------- Dark Map Style ------------------------------- */
/* Subtle high-contrast dark theme with gold-ish POIs */
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b1220" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1220" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9aa4b2" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c7b28a" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c7b28a" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0f1a2b" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9aa4b2" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#111a2c" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a2742" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9aa4b2" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1a2742" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a1529" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9aa4b2" }],
  },
];

/* ------------------------------- Component -------------------------------- */

export default function GymsNearMePage() {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [gymsError, setGymsError] = useState<string | null>(null);

  const [mapsError, setMapsError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const [radiusKm, setRadiusKm] = useState<number>(3); // switchable radius
  const [retryKey, setRetryKey] = useState<number>(0); // bump to retry Overpass

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const userMarkerRef = useRef<any | null>(null);
  const gymMarkersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any | null>(null); // shared InfoWindow

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as
    | string
    | undefined;

  /* ------------------- 1) Load Google Maps script once ------------------- */
  useEffect(() => {
    if (!apiKey) {
      setMapsError(
        "Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your .env.local."
      );
      return;
    }
    // Already loaded?
    if ((window as any).google?.maps) {
      setMapsLoaded(true);
      return;
    }
    // Already loading?
    if (document.getElementById("gmaps-script")) return;

    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => setMapsLoaded(true);
    script.onerror = () =>
      setMapsError("Failed to load Google Maps. Check your API key / network.");

    document.body.appendChild(script);
  }, [apiKey]);

  /* ----------------------- 2) Get current location ----------------------- */
  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocation({
        status: "error",
        message: "Geolocation is not supported by this browser.",
      });
      return;
    }
    setLocation({ status: "getting" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ status: "got", lat: latitude, lon: longitude });
      },
      (err) => {
        console.error(err);
        setLocation({
          status: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied. Enable it in your browser settings and refresh."
              : "Failed to get your location.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------- 3) Fetch gyms from Overpass API ------------------- */
  useEffect(() => {
    if (location.status !== "got") return;

    const fetchGyms = async () => {
      setLoadingGyms(true);
      setGymsError(null);

      try {
        const { lat, lon } = location;
        const radiusMeters = Math.round(radiusKm * 1000);

        const query = `
          [out:json][timeout:25];
          (
            node["leisure"="fitness_centre"](around:${radiusMeters},${lat},${lon});
            node["sport"="fitness"](around:${radiusMeters},${lat},${lon});
          );
          out center 60;
        `;

        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: query,
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
        });

        if (!res.ok) throw new Error(`Overpass error: ${res.status}`);

        const data = await res.json();
        const elements: any[] = data.elements || [];

        const gymsParsed: Gym[] = elements
          .filter(
            (el) =>
              el.type === "node" &&
              el.tags &&
              typeof el.tags.name === "string" &&
              el.tags.name.trim().length > 0
          )
          .map((el) => {
            const name: string = el.tags.name.trim();
            const addressParts = [
              el.tags?.addr_street,
              el.tags?.addr_housenumber,
              el.tags?.addr_city,
            ].filter(Boolean);
            const address = addressParts.length
              ? addressParts.join(" ")
              : undefined;

            const dist = distanceKm(lat, lon, el.lat, el.lon);

            return {
              id: String(el.id),
              name,
              lat: el.lat,
              lon: el.lon,
              distanceKm: dist,
              address,
            };
          })
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 25);

        setGyms(gymsParsed);
      } catch (err) {
        console.error(err);
        setGymsError(
          "Failed to load gyms. The map service might be rate-limited—try again in a moment."
        );
      } finally {
        setLoadingGyms(false);
      }
    };

    fetchGyms();
  }, [location, radiusKm, retryKey]);

  /* ----------------- 4) Init map once Google + location ready ------------ */
  useEffect(() => {
    if (!mapsLoaded) return;
    if (location.status !== "got") return;
    if (!mapDivRef.current) return;
    if (mapRef.current) return; // already made

    const center = { lat: location.lat, lng: location.lon };
    const mapOptions = {
      center,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      styles: DARK_MAP_STYLE,
    };

    mapRef.current = new google.maps.Map(mapDivRef.current, mapOptions);

    // User marker
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

    // Shared InfoWindow
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [mapsLoaded, location]);

  /* -------------------- 5) Rebuild markers when gyms change -------------- */
  useEffect(() => {
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !infoWindow) return;

    // Clear old markers
    gymMarkersRef.current.forEach((m) => m.setMap(null));
    gymMarkersRef.current = [];

    gyms.forEach((gym) => {
      const marker = new google.maps.Marker({
        position: { lat: gym.lat, lng: gym.lon },
        map,
        title: gym.name,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(
              `<svg width="24" height="24" viewBox="0 0 24 24" fill="#c7b28a" xmlns="http://www.w3.org/2000/svg">
                 <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
               </svg>`
            ),
          scaledSize: new google.maps.Size(26, 26),
        },
      });

      const html = `
        <div style="font-size:14px; font-weight:700; color:#e5e7eb;">${gym.name}</div>
        ${
          gym.address
            ? `<div style="font-size:12px; color:#a1a1aa; margin:2px 0 6px;">${gym.address}</div>`
            : ""
        }
        <a href="https://www.google.com/maps/search/?api=1&query=${gym.lat},${
        gym.lon
      }"
           target="_blank"
           style="font-size:12px; color:#fbbf24; text-decoration:none;">
          Open in Google Maps →
        </a>
      `;

      marker.addListener("click", () => {
        infoWindow.setContent(html);
        infoWindow.open(map, marker);
      });

      gymMarkersRef.current.push(marker);
    });
  }, [gyms]);

  /* -------------------------- Derived render bits ------------------------- */
  const locationHint = useMemo(() => {
    if (location.status === "getting")
      return "Getting your location…";
    if (location.status === "error") return location.message;
    if (location.status === "got")
      return `Showing gyms within ~${radiusKm} km of your location.`;
    return "";
  }, [location, radiusKm]);

  const recenter = () => {
    if (location.status !== "got" || !mapRef.current) return;
    const center = { lat: location.lat, lng: location.lon };
    mapRef.current.panTo(center);
    mapRef.current.setZoom(14);
  };

  const retryGyms = () => setRetryKey((k) => k + 1);

  /* --------------------------------- JSX --------------------------------- */

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Header */}
      <header className="px-4 pt-5 pb-4 border-b border-yellow-400/20 bg-slate-950/90">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-400/20 border border-yellow-400/30 flex items-center justify-center text-lg">
            🗺️
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Gyms near you
            </h1>
            <p className="text-sm text-slate-400">
              We use your current location to find nearby gyms.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {[1, 3, 5, 10].map((km) => (
              <button
                key={km}
                onClick={() => setRadiusKm(km)}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  radiusKm === km
                    ? "border-yellow-400/60 bg-yellow-500/15"
                    : "border-slate-700 bg-slate-900 hover:border-slate-600"
                }`}
              >
                {km} km
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={recenter}
              className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-slate-600"
            >
              Recenter
            </button>
            <button
              onClick={retryGyms}
              className="text-xs px-3 py-1 rounded-full border border-yellow-400/40 hover:bg-yellow-500/10"
            >
              Retry
            </button>
            <button
              onClick={requestLocation}
              className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-slate-600"
            >
              Refresh location
            </button>
          </div>
        </div>

        {/* Status / errors */}
        {location.status !== "idle" && (
          <p
            className={`text-xs ${
              location.status === "error" ? "text-red-300" : "text-slate-400"
            }`}
          >
            {locationHint}
          </p>
        )}

        {mapsError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {mapsError}
          </div>
        )}

        {/* Map container */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <div
            ref={mapDivRef}
            className="w-full h-72 bg-slate-900 flex items-center justify-center text-xs text-slate-400"
          >
            {!mapsLoaded && !mapsError && <span>Loading map…</span>}
          </div>
        </div>

        {/* Gyms error */}
        {gymsError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {gymsError}
          </div>
        )}

        {/* Loading state */}
        {location.status === "got" && loadingGyms && (
          <div className="grid gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-slate-900/80 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {location.status === "got" &&
          !loadingGyms &&
          gyms.length === 0 &&
          !gymsError && (
            <p className="text-xs text-slate-400">
              No gyms found within {radiusKm} km. Try a larger radius.
            </p>
          )}

        {/* Gym list */}
        {gyms.length > 0 && (
          <section className="space-y-3">
            {gyms.map((gym) => {
              const distLabel =
                gym.distanceKm < 1
                  ? `${Math.round(gym.distanceKm * 1000)} m`
                  : `${gym.distanceKm.toFixed(1)} km`;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${gym.lat},${gym.lon}`;
              return (
                <a
                  key={gym.id}
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl bg-slate-900/80 border border-slate-800 p-4 hover:border-yellow-400/40 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {gym.name}
                      </p>
                      {gym.address && (
                        <p className="text-xs text-slate-400">{gym.address}</p>
                      )}
                    </div>
                    <span className="text-xs text-amber-300">{distLabel}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-yellow-300/90">
                    Open in Google Maps →
                  </p>
                </a>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
