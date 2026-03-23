export function addHimawariLayer(map) {
  const videoUrl = `${import.meta.env.VITE_API_URL}/api/public/himawari.mp4`;

  // Clean up previous instance
  ["himawari-video-layer", "himawari-video"].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });

  map.addSource("himawari-video", {
    type: "video",
    urls: [videoUrl],
    coordinates: [
      [104, 29.55],
      [146.99, 29.55],
      [146.99, -1.5],
      [104, -1.5],
    ],
  });

  map.addLayer({
    id: "Satellite",
    type: "raster",
    source: "himawari-video",
    slot: "bottom",
    layout: { visibility: "none" },
    paint: { "raster-opacity": 0.95 },
  });

  // Autoplay when ready
  map.on("data", (e) => {
    if (e.sourceId === "himawari-video" && e.isSourceLoaded) {
      const video = map.getSource("himawari-video")?.getVideo();
      if (video) {
        video.loop = true;
        video.muted = true;
        video.play().catch((err) => console.warn("Video play failed:", err));
        // console.log("🎥 Himawari video started.");
      }
    }
  });
}