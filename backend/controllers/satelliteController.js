import fetch from "node-fetch";

const TOKEN = process.env.TOKEN || "";
const XSRF =  process.env.XSRF_TOKEN || "";
const panahon_session = process.env.PANAHON_SESSION || "";
// ⚠️ Replace with your actual cookies from panahon.gov.ph session
const PANAHON_COOKIE = `_ga=GA1.1.895444753.1751268319; _ga_W4CK6LCPJQ=GS2.1.s1759456400$o27$g1$t1759456557$j57$l0$h0; panahon_session= ${panahon_session}; XSRF-TOKEN= ${XSRF}`;

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
