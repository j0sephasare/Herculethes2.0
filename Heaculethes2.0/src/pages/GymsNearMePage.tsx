// src/pages/GymsNearMePage.tsx

// Tell TS that "google" will exist once the script is loaded
declare const google: any;

import { useEffect, useRef, useState } from "react";

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

export default function GymsNearMePage() {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [gymsError, setGymsError] = useState<string | null>(null);

  const [mapsError, setMapsError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const userMarkerRef = useRef<any | null>(null);
  const gymMarkersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any | null>(null); // shared InfoWindow for all gym pins

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as
    | string
    | undefined;

  // 1) Load Google Maps JS script once
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

    script.onload = () => {
      setMapsLoaded(true);
    };

    script.onerror = () => {
      setMapsError("Failed to load Google Maps. Check your API key / network.");
    };

    document.body.appendChild(script);
  }, [apiKey]);

  // 2) Get user location
  useEffect(() => {
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
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  // 3) Fetch gyms from Overpass when we have location
  useEffect(() => {
    if (location.status !== "got") return;

    const fetchGyms = async () => {
      setLoadingGyms(true);
      setGymsError(null);

      try {
        const { lat, lon } = location;
        const radius = 3000; // 3km radius

        const query = `
          [out:json];
          (
            node["leisure"="fitness_centre"](around:${radius},${lat},${lon});
            node["sport"="fitness"](around:${radius},${lat},${lon});
          );
          out center 40;
        `;

        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: query,
          headers: {
            "Content-Type": "text/plain;charset=UTF-8",
          },
        });

        if (!res.ok) {
          throw new Error(`Overpass error: ${res.status}`);
        }

        const data = await res.json();
        const elements: any[] = data.elements || [];

        const gymsParsed: Gym[] = elements
          // only keep nodes that actually have a *name* tag
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
          // sort by distance and limit number of gyms
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 20);

        setGyms(gymsParsed);
      } catch (err) {
        console.error(err);
        setGymsError(
          "Failed to load gyms. The map service might be rate-limited, please try again in a moment."
        );
      } finally {
        setLoadingGyms(false);
      }
    };

    fetchGyms();
  }, [location]);

  // 4) Initialise the map once Google + location are ready
  useEffect(() => {
    if (!mapsLoaded) return;
    if (location.status !== "got") return;
    if (!mapDivRef.current) return;
    if (mapRef.current) return; // map already created

    const center = { lat: location.lat, lng: location.lon };

    // No explicit google.maps.MapOptions type – avoids TS errors
    const mapOptions = {
      center,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      // grabs scroll/drag so you don't get the "Use two fingers" overlay
      gestureHandling: "greedy",
    };

    mapRef.current = new google.maps.Map(mapDivRef.current, mapOptions);

    // Add user marker (blue dot style)
    userMarkerRef.current = new google.maps.Marker({
      position: center,
      map: mapRef.current,
      title: "Your location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
      },
    });

    // Create one shared InfoWindow instance
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [mapsLoaded, location]);

  // 5) Whenever gyms change, draw gym markers (with clickable InfoWindow)
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
      });

      // Content for the InfoWindow
      const html = `
        <div style="font-size:14px; font-weight:600;">${gym.name}</div>
        ${
          gym.address
            ? `<div style="font-size:12px; color:#555;">${gym.address}</div>`
            : ""
        }
        <a href="https://www.google.com/maps/search/?api=1&query=${gym.lat},${
        gym.lon
      }"
           target="_blank"
           style="font-size:12px; color:#1a73e8; text-decoration:none;">
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

  const renderLocationStatus = () => {
    if (location.status === "getting") {
      return <p className="text-xs text-slate-400">Getting your location…</p>;
    }
    if (location.status === "error") {
      return <p className="text-xs text-red-300">{location.message}</p>;
    }
    if (location.status === "got") {
      return (
        <p className="text-xs text-slate-400">
          Showing gyms within ~3 km of your current location.
        </p>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Gyms near you</h1>
        <p className="text-sm text-slate-400">
          We use your current location to find nearby gyms.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderLocationStatus()}

        {mapsError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {mapsError}
          </div>
        )}

        {/* Map container */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <div
            ref={mapDivRef}
            className="w-full h-64 bg-slate-900 flex items-center justify-center text-xs text-slate-400"
          >
            {!mapsLoaded && !mapsError && <span>Loading map…</span>}
          </div>
        </div>

        {gymsError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {gymsError}
          </div>
        )}

        {location.status === "got" && loadingGyms && (
          <p className="text-xs text-slate-400">Searching for gyms…</p>
        )}

        {location.status === "got" &&
          !loadingGyms &&
          gyms.length === 0 &&
          !gymsError && (
            <p className="text-xs text-slate-400">
              No gyms found within 3 km. Try again later or expand the search
              radius in the code.
            </p>
          )}

        {/* Gym list below the map */}
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
                  className="block rounded-2xl bg-slate-900/80 border border-slate-800 p-4 hover:border-blue-500/60 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{gym.name}</p>
                      {gym.address && (
                        <p className="text-xs text-slate-400">
                          {gym.address}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-300">{distLabel}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-blue-400">
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
