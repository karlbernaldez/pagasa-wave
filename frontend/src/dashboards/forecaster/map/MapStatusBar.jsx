import { useEffect, useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";

const formatCoord = (value, type) => {
  const abs = Math.abs(value).toFixed(4);
  if (type === "lat") return `${abs}° ${value >= 0 ? "N" : "S"}`;
  if (type === "lon") return `${abs}° ${value >= 0 ? "E" : "W"}`;
};

const MapStatusBar = ({ mapRef }) => {
  const { isDarkMode } = useTheme();

  const [status, setStatus] = useState({ lat: null, lon: null, zoom: null });

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMove = (e) => {
      setStatus((prev) => ({
        ...prev,
        lat: formatCoord(e.lngLat.lat, "lat"),
        lon: formatCoord(e.lngLat.lng, "lon"),
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
  }, [mapRef]);

  const latVal  = status.lat  ?? "––.––––°";
  const lonVal  = status.lon  ?? "––.––––°";
  const zoomVal = status.zoom ?? "–.–";

  const textColor = isDarkMode ? "text-slate-200" : "text-slate-700";
  const labelColor = isDarkMode ? "text-slate-500" : "text-slate-400";

  return (
    <div
      className={`
        fixed bottom-4 right-4
        z-[90] pointer-events-none
        flex items-center gap-3
        font-mono text-[10px] tabular-nums
        opacity-80 hover:opacity-100
        transition-opacity duration-300
      `}
    >
      <span>
        <span className={`${labelColor} mr-1 tracking-widest uppercase text-[8px]`}>Lat</span>
        <span className={textColor}>{latVal}</span>
      </span>
      <span className={labelColor}>·</span>
      <span>
        <span className={`${labelColor} mr-1 tracking-widest uppercase text-[8px]`}>Lon</span>
        <span className={textColor}>{lonVal}</span>
      </span>
      <span className={labelColor}>·</span>
      <span>
        <span className={`${labelColor} mr-1 tracking-widest uppercase text-[8px]`}>Zoom</span>
        <span className={textColor}>{zoomVal}</span>
      </span>
    </div>
  );
};

export default MapStatusBar;