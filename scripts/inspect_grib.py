import pygrib

input_file = "10m_wind.grib"
output_file = "grib_inspect_output.txt"

with pygrib.open(input_file) as grbs, open(output_file, "w", encoding="utf-8") as f:
    f.write(f"=== GRIB FILE INSPECTION ===\n")
    f.write(f"File: {input_file}\n")
    f.write(f"Messages found: {len(grbs)}\n\n")

    for i, grb in enumerate(grbs, start=1):
        try:
            f.write(f"Message {i}:\n")
            f.write(f"  Name: {grb.name}\n")
            f.write(f"  Short name: {grb.shortName}\n")
            f.write(f"  Level type: {grb.typeOfLevel}\n")
            f.write(f"  Level: {grb.level}\n")
            f.write(f"  Units: {grb.units}\n")
            f.write(f"  Valid time: {grb.validDate}\n")
            f.write(f"  Anal time: {grb.analDate}\n")
            f.write(f"  Parameter number: {grb.paramId}\n")
            f.write(f"  Shape: {grb.values.shape}\n")

            # Optional metadata keys
            try:
                f.write(f"  GRIB_COMMENT: {grb['name']}\n")
            except Exception:
                pass

            try:
                f.write(f"  GRIB_VALID_TIME: {grb.validDate}\n")
            except Exception:
                pass

            f.write("-" * 60 + "\n")
        except Exception as e:
            f.write(f"Error reading message {i}: {e}\n")
            f.write("-" * 60 + "\n")

print(f"✅ Inspection complete! Results saved to '{output_file}'")
