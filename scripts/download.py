from ecmwf.opendata import Client
from datetime import datetime, timedelta, timezone
import os, subprocess

# ----------------------------------------
# CONFIG
# ----------------------------------------
OUTDIR = "./ecmwf_data"
PARAMS = ["10u", "10v"]
STREAM = "oper"
MODEL = "ifs"
CYCLE = 0            # 00 UTC run
STEPS = list(range(0, 145, 3))  # 0h → 144h every 3h

os.makedirs(OUTDIR, exist_ok=True)

client = Client(
    source="ecmwf",
    model=MODEL,
    resol="0p25",
)

def download_steps(date_str: str):
    downloaded = []
    print(f"\n🔍 Downloading forecast for {date_str} (steps 0h → 144h @ 3h intervals)\n")

    for step in STEPS:
        step_str = f"{step}h"
        for param in PARAMS:
            outfile = os.path.join(
                OUTDIR, f"{param}_{date_str}_{CYCLE:02d}UTC_{step_str}.grib2"
            )
            print(f"⬇️ [{param}] step={step_str} → {outfile}")

            try:
                client.retrieve(
                    date=date_str,
                    time=CYCLE,
                    type="fc",
                    stream=STREAM,
                    step=step,
                    param=param,
                    target=outfile,
                )
                downloaded.append(outfile)

            except Exception as e:
                print(f"⚠️ Not available ({param} @ step {step_str}) — {e}")

    return downloaded


def merge_grib_files(files, output):
    if not files:
        print("\n❌ No GRIB files downloaded. Nothing to merge.")
        return

    print("\n🔧 Merging GRIB files into one...\n")
    cmd = ["grib_copy"] + files + [output]

    try:
        subprocess.run(cmd, check=True)
        print(f"✅ MERGED → {output}")
    except Exception as e:
        print(f"❌ Merge failed: {e}")


# ----------------------------------------
# MAIN
# ----------------------------------------
now = datetime.now(timezone.utc)
today = now.strftime("%Y-%m-%d")

files_today = download_steps(today)

if not files_today:
    yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    print("\n⚠️ No data found today. Trying yesterday...\n")
    files_yesterday = download_steps(yesterday)
    merge_grib_files(files_yesterday, os.path.join(OUTDIR, f"ECMWF.grib2"))
else:
    merge_grib_files(files_today, os.path.join(OUTDIR, f"ECMWF.grib2"))

print("\n✅ DONE.")
print(f"📂 Output folder: {os.path.abspath(OUTDIR)}")
