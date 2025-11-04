from ecmwf.opendata import Client
from datetime import datetime, timedelta, timezone
import os
import subprocess

outdir = "./ecmwf_data"
os.makedirs(outdir, exist_ok=True)

client = Client(source="ecmwf")

# Pick the most recent *available* forecast run
now = datetime.now(timezone.utc)
latest_run = now - timedelta(hours=12)
run_hour = (latest_run.hour // 6) * 6
run_date = latest_run.strftime("%Y-%m-%d")

print(f"🌍 ECMWF IFS Open Data – HRES forecast {run_date} {run_hour:02d} UTC")

grib_files = []

for param in ["10u", "10v"]:
    outfile = os.path.join(outdir, f"{param}_{run_date}_{run_hour:02d}UTC.grib2")
    print(f"⬇️  Fetching {param} → {outfile}")

    client.retrieve(
        {
            "type": "fc",
            "stream": "oper",
            "date": run_date,
            "time": f"{run_hour:02d}",
            "step": 360,
            "param": param,
            "grid": "0.4/0.4",
        },
        target=outfile
    )
    grib_files.append(outfile)

print("✅ Download complete.")

# Combine GRIB files
combined_file = os.path.join(outdir, f"wind_combined_{run_date}_{run_hour:02d}UTC.grib2")
print(f"🔄 Combining files → {combined_file}")

# Method 1: Simple concatenation (works for GRIB files)
with open(combined_file, 'wb') as outf:
    for grib_file in grib_files:
        with open(grib_file, 'rb') as inf:
            outf.write(inf.read())

print(f"✅ Combined file created: {os.path.abspath(combined_file)}")

# Optional: Clean up individual files
# for f in grib_files:
#     os.remove(f)