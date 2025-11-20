# import pygrib

# input_file = "20250922v2.grib"
# output_file = "grib_inspect_output.txt"

# with pygrib.open(input_file) as grbs, open(output_file, "w", encoding="utf-8") as f:
#     f.write(f"=== GRIB FILE INSPECTION ===\n")
#     f.write(f"File: {input_file}\n")
#     f.write(f"Messages found: {len(grbs)}\n\n")

#     for i, grb in enumerate(grbs, start=1):
#         try:
#             f.write(f"Message {i}:\n")
#             f.write(f"  Name: {grb.name}\n")
#             f.write(f"  Short name: {grb.shortName}\n")
#             f.write(f"  Level type: {grb.typeOfLevel}\n")
#             f.write(f"  Level: {grb.level}\n")
#             f.write(f"  Units: {grb.units}\n")
#             f.write(f"  Valid time: {grb.validDate}\n")
#             f.write(f"  Anal time: {grb.analDate}\n")
#             f.write(f"  Parameter number: {grb.paramId}\n")
#             f.write(f"  Shape: {grb.values.shape}\n")

#             # Optional metadata keys
#             try:
#                 f.write(f"  GRIB_COMMENT: {grb['name']}\n")
#             except Exception:
#                 pass

#             try:
#                 f.write(f"  GRIB_VALID_TIME: {grb.validDate}\n")
#             except Exception:
#                 pass

#             f.write("-" * 60 + "\n")
#         except Exception as e:
#             f.write(f"Error reading message {i}: {e}\n")
#             f.write("-" * 60 + "\n")

# print(f"✅ Inspection complete! Results saved to '{output_file}'")

from osgeo import gdal
import pandas as pd

grib_file = "gfs.t18z.pgrb2.0p25.f000"
output_excel = "grib_metadata2.xlsx"

ds = gdal.Open(grib_file)
if not ds:
    raise Exception(f"❌ Unable to open GRIB file: {grib_file}")

rows = []
for i in range(1, ds.RasterCount + 1):
    band = ds.GetRasterBand(i)
    desc = band.GetDescription()
    metadata = band.GetMetadata()
    for key, value in metadata.items():
        rows.append({
            "Band": i,
            "Description": desc,
            "Key": key,
            "Value": value
        })

df = pd.DataFrame(rows)
df.to_excel(output_excel, index=False)
print(f"✅ Metadata saved to {output_excel}")