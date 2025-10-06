import os
import boto3
from botocore import UNSIGNED
from botocore.config import Config
from datetime import datetime, timedelta, timezone

# Local storage
BASE_DIR = "/home/philsca/himawari_ir1"
os.makedirs(BASE_DIR, exist_ok=True)

# Public NOAA Himawari S3 bucket
BUCKET = "noaa-himawari8"
PREFIX = "HIMAWARI-8/AHI/L1B/RadF"

# Anonymous S3 client (no creds required)
s3 = boto3.client("s3", config=Config(signature_version=UNSIGNED))

# Use last available timestamp (shift 1-2 hours back to ensure data exists)
end_time = datetime.now(timezone.utc) - timedelta(hours=1)

# Format path
date_prefix = f"{PREFIX}/{end_time:%Y/%m/%d/%H}"
print("Searching in:", date_prefix)

# List files in that hour
resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=date_prefix)

if "Contents" not in resp:
    print("No files found for this time.")
else:
    # Filter only IR1 (C13) files
    ir1_files = [obj["Key"] for obj in resp["Contents"] if "C13" in obj["Key"]]

    if not ir1_files:
        print("No C13 (IR1) files found.")
    else:
        latest_file = sorted(ir1_files)[-1]  # pick latest
        filename = os.path.join(BASE_DIR, os.path.basename(latest_file))

        print("Downloading:", latest_file)
        s3.download_file(BUCKET, latest_file, filename)
        print("Saved to:", filename)
