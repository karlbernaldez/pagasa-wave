from ecmwf.opendata import Client
from datetime import datetime, timedelta, timezone
import os, subprocess, signal, sys

# ----------------------------------------
# CONFIG
# ----------------------------------------
OUTDIR = "./ECMWF/ecmwf_data/"
PARAMS = ["10u", "10v"]
STREAM = "oper"
MODEL = "ifs"
CYCLE = 0
STEPS = list(range(0, 145, 3))  # every 3h step until 144h

TIMEOUT_SECONDS = 5  # <-- ✅ 5 second timeout per request

os.makedirs(OUTDIR, exist_ok=True)

client = Client(
    source="ecmwf",
    model=MODEL,
    resol="0p25",
)


# ------------------------ TIMEOUT HANDLER ------------------------
def timeout_handler(signum, frame):
    raise TimeoutError("⏰ Request timed out")


signal.signal(signal.SIGALRM, timeout_handler)


# ------------------------ DOWNLOAD ------------------------
def download_steps(date_str: str):
    downloaded = []
    print(f"\n🔍 Downloading forecast for {date_str} (steps 0 → 144 @ 3h)\n")

    for step in STEPS:
        step_str = f"{step}h"
        for param in PARAMS:
            outfile = os.path.join(
                OUTDIR, f"{param}_{date_str}_{CYCLE:02d}UTC_{step_str}.grib2"
            )
            print(f"⬇️ [{param}] step={step_str} → {outfile}")

            try:
                signal.alarm(TIMEOUT_SECONDS)  # 🔥 ENABLE 5s TIMEOUT

                client.retrieve(
                    date=date_str,
                    time=CYCLE,
                    type="fc",
                    stream=STREAM,
                    step=step,
                    param=param,
                    target=outfile,
                )

                signal.alarm(0)  # ✅ disable timeout
                downloaded.append(outfile)

            except TimeoutError:
                print(f"⏰ ❌ Timeout ({param} @ {step_str}) skipping...")

            except Exception as e:
                print(f"⚠️ Not available ({param} @ {step_str}) — {e}")
                if os.path.exists(outfile):
                    os.remove(outfile)

    return downloaded


# ------------------------ MERGE + CLEAN ------------------------
def merge_and_clean(files, output):
    if not files:
        print("\n❌ No GRIB files downloaded. Nothing to merge.")
        return

    print("\n🔧 Merging GRIB files into one...\n")
    cmd = ["grib_copy"] + files + [output]

    try:
        subprocess.run(cmd, check=True)
        print(f"✅ MERGED → {output}")

        # delete all temporary part files
        print("\n🧹 Cleaning up temporary GRIB chunks...")
        for f in files:
            if os.path.exists(f):
                os.remove(f)
                print(f"   🗑 Removed {f}")

        print("✅ Cleanup complete. Only merged GRIB remains.")

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
    merge_and_clean(files_yesterday, os.path.join(OUTDIR, f"ECMWF.grib2"))
else:
    merge_and_clean(files_today, os.path.join(OUTDIR, f"ECMWF.grib2"))

print("\n✅ DONE.")
print(f"📂 Output folder: {os.path.abspath(OUTDIR)}")
