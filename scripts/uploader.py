import requests
import time

# === CONFIG ===
ACCESS_TOKEN = ""
USERNAME = ""
TILESET_NAME = ""
FILE_PATH = ""

# 1️⃣ Upload the file directly
upload_url = f"https://api.mapbox.com/uploads/v1/{USERNAME}?access_token={ACCESS_TOKEN}"

with open(FILE_PATH, "rb") as f:
    files = {"file": f}  # send the local file
    data = {
        "tileset": f"{USERNAME}.{TILESET_NAME}",
        "name": "ERA5 Wind Wave Data"
    }
    response = requests.post(upload_url, files=files, data=data)

if response.status_code not in [200, 201]:
    print("❌ Upload failed:", response.text)
    exit(1)

upload_info = response.json()
upload_id = upload_info.get("id")
print("✅ Upload started, ID:", upload_id)

# Check status
status_url = f"https://api.mapbox.com/uploads/v1/{USERNAME}/{upload_id}?access_token={ACCESS_TOKEN}"
while True:
    r = requests.get(status_url)
    status_data = r.json()
    if status_data.get("complete"):
        print("✅ Upload complete!")
        break
    else:
        print("⏳ Processing... waiting 10s")
        time.sleep(10)

print("Tileset URL:", f"mapbox://{USERNAME}.{TILESET_NAME}")