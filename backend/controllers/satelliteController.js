import fetch from "node-fetch";

const TOKEN = "XbyFSjrJ3zM43rGeUE3vCOE9O7LK4gsPzNHBwCfo";

// ⚠️ Replace with your actual cookies from panahon.gov.ph session
const PANAHON_COOKIE = "_ga=GA1.1.895444753.1751268319; panahon_session=eyJpdiI6InZVS1RxK1ZvWFl2RU9Id2RoTHVJaXc9PSIsInZhbHVlIjoiNDhSdFVkT0M1cE10b0k4dDhvaGdFVmg2OU03REEzRUxzbUFjS2wrQWhxVzlXNVZWRGJQUitPdzZZTi9pTytsYVBRYWxqL3VWbW1rSTROTEZxRlpXeXUxcVpBK01oZFJ1THp0V3luemFVT2VaanlHazVtd0hMSWJkZnZYN3ZYQXkiLCJtYWMiOiI1YzBmMWQ3NDU2MjE1NTk3NTc1YTJhN2ZmNGE1MGRjNjlmMWU5MGJjYzNiNzEzMzc5OWU4NDE2NDBkYTE0NmM1IiwidGFnIjoiIn0; XSRF-TOKEN=eyJpdiI6ImVaVDd4WlhJdG1jMUU0U0tTUzlpcHc9PSIsInZhbHVlIjoiZFRiWGUwMVhuNzNHd1NwSWlJaGh1R2lXejBXZTJYVlZRY1VPS0NKYnExTGlWTDFLdGFPamFRZGlKODlxa0laVzJ1SS9YMWNWVmdaT1EwQXJTUTZCR2g4VTRGWXFNeXJVellMNi9oeGpHNGsySi9vODUvSmNwVFQ1cWY1VUx5ZlMiLCJtYWMiOiI3ZDcxNTM1OTc1MjZhMTFiOGIzNzA5NTgyMmE5YzlkMTcwMjhmOTdkMzEzNzkzOTgxNzlmNDM0N2U3MjlkNDg3IiwidGFnIjoiIn0";

// ✅ Fetch satellite image by ID
export const getSatelliteImageById = async (req, res) => {
  const { id } = req.params;
  const url = `https://www.panahon.gov.ph/api/v1/satellite?id=${id}&parameter=sat&token=${TOKEN}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Cookie": PANAHON_COOKIE,
        "User-Agent": "Mozilla/5.0",
        "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(`Error fetching image: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    res.set("Content-Type", "image/png"); // adjust to JPEG if needed
    res.send(buffer);
  } catch (err) {
    console.error("Satellite proxy error:", err);
    res.status(500).send("Server proxy error");
  }
};

// ✅ Fetch all 24 satellite images
export const getAllSatelliteImages = async (req, res) => {
  try {
    const promises = Array.from({ length: 24 }, async (_, i) => {
      const id = i + 1;
      const url = `https://www.panahon.gov.ph/api/v1/satellite?id=${id}&parameter=sat&token=${TOKEN}`;

      const response = await fetch(url, {
        headers: {
          "Cookie": PANAHON_COOKIE,
          "User-Agent": "Mozilla/5.0",
          "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        },
      });
      console.log('--------------------------------------------------------');
      console.log(`Satellite API REPSONSE for ID ${id} : `, response);
      console.log('--------------------------------------------------------');

      if (!response.ok) return null;
      const buffer = await response.buffer();
      return {
        id,
        image: `data:image/png;base64,${buffer.toString("base64")}`,
      };
    });

    const results = await Promise.all(promises);
    res.json(results.filter(Boolean));
  } catch (err) {
    console.error("Error fetching all satellite images:", err);
    res.status(500).send("Server error fetching images");
  }
};
