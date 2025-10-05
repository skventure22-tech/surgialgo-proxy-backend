import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";

const app = express();
app.use(express.json());

const BASE_URL = process.env.MODE === "prod"
  ? "https://api.india.delta.exchange"
  : "https://cdn-ind.testnet.deltaex.org";

function sign(secret, data) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

app.get("/", (req, res) => {
  res.json({ message: "🟢 SurgiAlgo Proxy Active", mode: process.env.MODE });
});

app.get("/api/connect", async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.query;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = "GET";
    const path = "/v2/products";
    const signatureData = method + timestamp + path;
    const signature = sign(apiSecret, signatureData);

    const headers = {
      "api-key": apiKey,
      "timestamp": timestamp,
      "signature": signature,
      "User-Agent": "surgialgo-proxy",
    };

    const response = await fetch(`${BASE_URL}${path}`, { headers });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("✅ SurgiAlgo proxy running on port", process.env.PORT || 3000);
});
