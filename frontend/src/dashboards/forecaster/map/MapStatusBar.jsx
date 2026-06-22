import { useEffect, useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";

const formatCoord = (value, type) => {
  const abs = Math.abs(value).toFixed(4);
  if (type === "lat") return `${abs} deg ${value >= 0 ? "N" : "S"}`;
  if (type === "lon") return `${abs} deg ${value >= 0 ? "E" : "W"}`;
  return `${abs} deg`;
};

const MapStatusBar = ({ mapRef, visible = false }) => {
  const { isDarkMode } = useTheme();
  const [status, setStatus] = useState({ lat: null, lon: null, zoom: null });

  useEffect(() => {
    if (!visible) return undefined;

    const map = mapRef.current;
    if (!map) return undefined;

    const handleMove = (event) => {
      setStatus((prev) => ({
        ...prev,
        lat: formatCoord(event.lngLat.lat, "lat"),
        lon: formatCoord(event.lngLat.lng, "lon"),
      }));
    };

    const handleZoom = () => {
      setStatus((prev) => ({ ...prev, zoom: map.getZoom().toFixed(1) }));
    };

    map.on("mousemove", handleMove);
    map.on("zoom", handleZoom);
    handleZoom();

    return () => {
      map.off("mousemove", handleMove);
      map.off("zoom", handleZoom);
    };
  }, [mapRef, visible]);

  if (!visible) return null;

  const latVal = status.lat ?? "--.---- deg";
  const lonVal = status.lon ?? "--.---- deg";
  const zoomVal = status.zoom ?? "-.-";

  const panelTone = isDarkMode
    ? "studio-liquid-dark border-white/[0.18] text-white"
    : "studio-liquid-light border-white/80 text-slate-900";
  const textColor = isDarkMode ? "text-white/80" : "text-slate-700";
  const labelColor = isDarkMode ? "text-white/35" : "text-slate-400";

  return (
    <div
      className={`
        studio-liquid-panel fixed bottom-4 right-4
        z-[90] pointer-events-none
        flex items-center gap-3
        rounded-full border px-3 py-2 shadow-2xl
        font-mono text-[10px] tabular-nums
        transition-opacity duration-300
        ${panelTone}
      `}
    >
      <span>
        <span className={`${labelColor} mr-1 text-[8px] uppercase tracking-widest`}>Lat</span>
        <span className={textColor}>{latVal}</span>
      </span>
      <span className={labelColor}>/</span>
      <span>
        <span className={`${labelColor} mr-1 text-[8px] uppercase tracking-widest`}>Lon</span>
        <span className={textColor}>{lonVal}</span>
      </span>
      <span className={labelColor}>/</span>
      <span>
        <span className={`${labelColor} mr-1 text-[8px] uppercase tracking-widest`}>Zoom</span>
        <span className={textColor}>{zoomVal}</span>
      </span>
    </div>
  );
};

export default MapStatusBar;
