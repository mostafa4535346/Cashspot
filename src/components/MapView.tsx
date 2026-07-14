import { useEffect, useRef } from "react";
import maplibregl, { type Map as MLMap, Marker } from "maplibre-gl";
import type { Database } from "@/integrations/supabase/types";

type Atm = Database["public"]["Tables"]["atms"]["Row"];

const STATUS_COLOR: Record<string, string> = {
  cash_available: "oklch(0.72 0.19 155)",
  no_cash: "oklch(0.62 0.22 25)",
  busy: "oklch(0.78 0.16 65)",
  out_of_service: "oklch(0.55 0.02 260)",
  deposit_available: "oklch(0.65 0.17 240)",
  unknown: "oklch(0.55 0.02 260)",
};

export function MapView({
  atms,
  center,
  userLocation,
  onSelect,
  isDark,
}: {
  atms: Atm[];
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  onSelect: (atm: Atm) => void;
  isDark: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const style = isDark
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [center.lng, center.lat],
      zoom: 12,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    // Ensure the map sizes correctly once layout settles (mobile viewport / late fonts).
    const kick = () => map.resize();
    requestAnimationFrame(kick);
    setTimeout(kick, 100);
    setTimeout(kick, 500);
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    window.addEventListener("resize", kick);
    return () => {
      window.removeEventListener("resize", kick);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const style = isDark
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
    map.setStyle(style);
  }, [isDark]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    atms.forEach((atm) => {
      const el = document.createElement("div");
      el.style.cssText = `width:28px;height:28px;border-radius:9999px;background:${STATUS_COLOR[atm.status] ?? STATUS_COLOR.unknown};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.35);cursor:pointer;transition:transform .15s;`;
      el.onmouseenter = () => (el.style.transform = "scale(1.15)");
      el.onmouseleave = () => (el.style.transform = "scale(1)");
      el.onclick = () => onSelect(atm);
      const marker = new maplibregl.Marker({ element: el }).setLngLat([atm.lng, atm.lat]).addTo(map);
      markersRef.current.push(marker);
    });
  }, [atms, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    userMarkerRef.current?.remove();
    if (userLocation) {
      const el = document.createElement("div");
      el.style.cssText = "width:20px;height:20px;border-radius:9999px;background:oklch(0.65 0.2 250);border:4px solid white;box-shadow:0 0 0 6px oklch(0.65 0.2 250 / .25);";
      userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
      map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 13, essential: true });
    }
  }, [userLocation]);

  return <div ref={containerRef} className="absolute inset-0" style={{ width: "100%", height: "100%" }} />;
}
