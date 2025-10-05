import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import cors from "cors"; // ✅ Added for frontend connection

const app = express();
app.use(express.json());

// ✅ Allow frontend domain surgialgo.shop to connect
app.use(
  cors({
    origin: ["https://surgialgo.shop"], // तुमचा React frontend domain
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "api-key", "timestamp", "signature"],
  })
);

// ✅ Base URL setup (auto testnet/prod)
const BASE_URL =
  process.env.MODE === "prod"
    ? "https://api.india.delta.exchange"
    : "https://cdn-ind.testnet.deltaex.org";

// ✅ Signature generator (HMAC-SHA256)
function sign(secret, data) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

// ✅ Root check route
app.get("/", (req, res) => {
  res.json({ message: "🟢 SurgiAlgo Proxy Active", mode: process.env.MODE || "testnet" });
});

// ✅ Delta Connect API route
app.get("/api/connect", async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.query;
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ success: false, error: "Missing API credentials" });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = "GET";
    const path = "/v2/products";
    const signatureData = method + timestamp + path;
    const signature = sign(apiSecret, signatureData);

    const headers = {
      "api-key": apiKey,
      timestamp,
      signature,
      "User-Agent": "surgialgo-proxy",
    };

    const response = await fetch(`${BASE_URL}${path}`, { headers });
    const data = await response.json();

    // ✅ Handle Delta API errors gracefully
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.error || "Failed to connect Delta Exchange",
      });
    }

    res.json({
      success: true,
      source: BASE_URL.includes("testnet") ? "Testnet" : "Production",
      count: data.result?.length || 0,
      result: data.result || [],
    });
  } catch (err) {
    console.error("❌ Proxy Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ SurgiAlgo proxy running on port ${PORT}`);
});
