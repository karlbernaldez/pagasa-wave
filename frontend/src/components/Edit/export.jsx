import React from "react";

const ExportMapButton = ({ mapRef, features }) => {
  const exportMapImageAndGeoJSON = () => {
    const map = mapRef?.current;
    if (!map) {
      console.error("❌ Map reference is not available.");
      return;
    }

    if (!features || !features.features || features.features.length === 0) {
      alert("⚠️ No features to export.");
      window.location.reload();  // Refresh the page
      return;
    }

    const bounds = [
      [110, 0],
      [155, 27],
    ];

    // Fit to bounds
    map.fitBounds(bounds, {
      padding: { top: 20, bottom: 20, left: 20, right: 20 },
      duration: 0,
    });

    // Wait for the map to finish rendering before exporting
    map.once("idle", () => {
      try {
        // 📷 Export map screenshot
        const canvas = map.getCanvas();
        const dataURL = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `map-screenshot-${Date.now()}.png`;
        link.click();

        // 🧾 Export GeoJSON
        const geojsonData = JSON.stringify(features, null, 2);
        const blob = new Blob([geojsonData], { type: "application/geo+json" });
        const url = URL.createObjectURL(blob);

        const geojsonLink = document.createElement("a");
        geojsonLink.href = url;
        geojsonLink.download = `features-${Date.now()}.geojson`;
        document.body.appendChild(geojsonLink);
        geojsonLink.click();
        document.body.removeChild(geojsonLink);
        URL.revokeObjectURL(url);

        console.log("✅ Export complete.");
      } catch (err) {
        console.error("❌ Export failed:", err);
      }
    });
  };

  return (
    <button
      onClick={exportMapImageAndGeoJSON}
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        padding: "10px 16px",
        fontSize: "14px",
        background: "#0077ff",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      📷 Export Map & GeoJSON
    </button>
  );
};

export default ExportMapButton;
