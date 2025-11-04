import numpy as np
import rioxarray
import rasterio
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from pathlib import Path

class WindVisualizer:
    """Enhanced wind speed visualization with SOLARSTORM colormap."""
    
    def __init__(self, max_wind_kt=80, gamma=0.6, alpha=0.85):
        """
        Initialize wind visualizer.
        
        Args:
            max_wind_kt: Maximum wind speed for normalization (knots)
            gamma: Gamma correction for contrast enhancement (0.5-1.0)
            alpha: Transparency level (0.0-1.0)
        """
        self.max_wind_kt = max_wind_kt
        self.gamma = gamma
        self.alpha = int(alpha * 255)
        self.cmap = self._create_solarstorm_cmap()
        
    def _create_solarstorm_cmap(self):
        """Create high-resolution SOLARSTORM colormap."""
        solarstorm = [
            (0.00, "#2a00b5"),  # strong violet
            (0.08, "#0047ff"),  # electric blue
            (0.12, "#00c6ff"),  # cyan
            (0.24, "#00ffc8"),  # aqua/mint
            (0.40, "#23ce26"),  # neon green
            (0.48, "#ffe600"),  # yellow
            (0.58, "#ff8c00"),  # orange
            (0.68, "#ff004c"),  # red
            (0.88, "#ff00b8"),  # magenta
            (0.94, "#ffffff"),  # white heat core
            (1.00, "#aaaaaa"),  # light gray (saturation)
        ]
        return LinearSegmentedColormap.from_list("solarstorm", solarstorm, N=4096)
    
    def load_wind_data(self, filepath):
        """
        Load wind speed data from GeoTIFF.
        
        Args:
            filepath: Path to wind speed GeoTIFF (m/s)
            
        Returns:
            tuple: (wind_ms, wind_knots, transform, crs)
        """
        if not Path(filepath).exists():
            raise FileNotFoundError(f"Wind data file not found: {filepath}")
            
        da = rioxarray.open_rasterio(filepath)
        wind_ms = da.squeeze().values
        
        # Convert m/s to knots (1 m/s = 1.94384 kt)
        wind_knots = wind_ms * 1.94384
        
        return wind_ms, wind_knots, da.rio.transform(), da.rio.crs
    
    def normalize_wind(self, wind_knots):
        """
        Normalize and enhance wind data for visualization.
        
        Args:
            wind_knots: Wind speed array in knots
            
        Returns:
            Normalized array (0-1)
        """
        # Clip to max range
        normalized = np.clip(wind_knots / self.max_wind_kt, 0, 1)
        
        # Apply gamma correction for contrast enhancement
        normalized = normalized ** self.gamma
        
        return normalized
    
    def apply_colormap(self, normalized_wind):
        """
        Apply SOLARSTORM colormap with transparency.
        
        Args:
            normalized_wind: Normalized wind array (0-1)
            
        Returns:
            RGBA array (uint8)
        """
        # Apply colormap
        rgba = (self.cmap(normalized_wind) * 255).astype(np.uint8)
        
        # Set alpha channel
        rgba[:, :, 3] = self.alpha
        
        return rgba
    
    def save_geotiff(self, rgba, transform, crs, output_path, compression="DEFLATE"):
        """
        Save RGBA data as GeoTIFF with proper georeferencing.
        
        Args:
            rgba: RGBA array to save
            transform: Affine transform from source data
            crs: Coordinate reference system
            output_path: Output file path
            compression: Compression method (DEFLATE, LZW, etc.)
        """
        profile = {
            "driver": "GTiff",
            "height": rgba.shape[0],
            "width": rgba.shape[1],
            "count": 4,
            "dtype": "uint8",
            "transform": transform,
            "crs": crs,
            "compress": compression,
            "tiled": True,
            "blockxsize": 256,
            "blockysize": 256,
            "photometric": "RGB",
            "ALPHA": "YES",
        }
        
        with rasterio.open(output_path, "w", **profile) as dst:
            for i in range(4):
                dst.write(rgba[:, :, i], i + 1)
                
        print(f"✅ Saved: {output_path}")
    
    def create_preview(self, rgba, wind_knots, output_path=None, dpi=150):
        """
        Create visualization preview with colorbar and statistics.
        
        Args:
            rgba: RGBA array to display
            wind_knots: Original wind data in knots
            output_path: Optional path to save preview
            dpi: Resolution for saved figure
        """
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
        
        # Main visualization
        ax1.imshow(rgba)
        ax1.axis("off")
        ax1.set_title("SOLARSTORM Wind Visualization", fontsize=14, fontweight="bold")
        
        # Statistics panel
        stats_text = self._generate_stats(wind_knots)
        ax2.text(0.1, 0.5, stats_text, fontsize=11, family="monospace",
                verticalalignment="center", transform=ax2.transAxes)
        ax2.axis("off")
        ax2.set_title("Wind Statistics", fontsize=14, fontweight="bold")
        
        # Add colorbar
        sm = plt.cm.ScalarMappable(cmap=self.cmap, 
                                   norm=plt.Normalize(vmin=0, vmax=self.max_wind_kt))
        sm.set_array([])
        cbar = plt.colorbar(sm, ax=ax2, orientation="horizontal", 
                          pad=0.05, aspect=30, fraction=0.1)
        cbar.set_label("Wind Speed (knots)", fontsize=10)
        
        plt.tight_layout()
        
        if output_path:
            plt.savefig(output_path, dpi=dpi, bbox_inches="tight")
            print(f"✅ Preview saved: {output_path}")
        
        plt.show()
    
    def _generate_stats(self, wind_knots):
        """Generate statistics text for visualization."""
        valid_data = wind_knots[~np.isnan(wind_knots)]
        
        return (
            f"Max Wind:     {np.max(valid_data):.1f} kt\n"
            f"Mean Wind:    {np.mean(valid_data):.1f} kt\n"
            f"Median Wind:  {np.median(valid_data):.1f} kt\n"
            f"Std Dev:      {np.std(valid_data):.1f} kt\n"
            f"\n"
            f"Grid Size:    {wind_knots.shape[1]} × {wind_knots.shape[0]}\n"
            f"Total Pixels: {wind_knots.size:,}\n"
            f"Valid Pixels: {len(valid_data):,}\n"
            f"\n"
            f"Colormap:     SOLARSTORM v2\n"
            f"Range:        0–{self.max_wind_kt} kt\n"
            f"Gamma:        {self.gamma}\n"
            f"Alpha:        {self.alpha/255:.0%}"
        )
    
    def process(self, input_path, output_path="wind_solarstorm.tif", 
                preview=True, preview_path=None):
        """
        Complete processing pipeline.
        
        Args:
            input_path: Path to input wind GeoTIFF (m/s)
            output_path: Path for output RGBA GeoTIFF
            preview: Whether to show/save preview
            preview_path: Optional path to save preview image
        """
        print(f"🌪️  Processing wind data: {input_path}")
        
        # Load data
        wind_ms, wind_knots, transform, crs = self.load_wind_data(input_path)
        print(f"   Loaded: {wind_knots.shape[1]}×{wind_knots.shape[0]} grid")
        print(f"   Max wind: {np.nanmax(wind_knots):.1f} kt")
        
        # Normalize
        normalized = self.normalize_wind(wind_knots)
        
        # Apply colormap
        rgba = self.apply_colormap(normalized)
        
        # Save GeoTIFF
        self.save_geotiff(rgba, transform, crs, output_path)
        
        # Preview
        if preview:
            self.create_preview(rgba, wind_knots, preview_path)


# -------------------------------------------------------
# 🚀 USAGE EXAMPLE
# -------------------------------------------------------
if __name__ == "__main__":
    # Initialize visualizer with custom parameters
    visualizer = WindVisualizer(
        max_wind_kt=80,      # Dynamic range
        gamma=0.6,           # Contrast enhancement
        alpha=0.85           # Transparency
    )
    
    # Process wind data
    visualizer.process(
        input_path="wind_speed.tif",
        output_path="wind_solarstorm.tif",
        preview=True,
        preview_path="wind_preview.png"
    )
    
    # Alternative: process multiple files
    # for file in Path(".").glob("wind_*.tif"):
    #     visualizer.process(file, f"{file.stem}_solarstorm.tif")