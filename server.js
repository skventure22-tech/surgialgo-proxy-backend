import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(express.json());

// ✅ Allow requests from frontend
app.use(
  cors({
     origin: [
      "https://surgialgo.shop",     // Hostinger frontend
      "https://www.surgialgo.shop", // if www is used
      "http://localhost:5173"       // for local dev (Vite)
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "api-key", "timestamp", "signature"],
  })
);

// ✅ Base URL setup (switches between Testnet & Prod)
const BASE_URL =
  process.env.MODE === "prod"
    ? "https://api.india.delta.exchange"
    : "https://cdn-ind.testnet.deltaex.org";

// ✅ Signature Generator
function sign(secret, data) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

// ✅ Default route
app.get("/", (req, res) => {
  res.json({
    message: "🟢 SurgiAlgo Proxy Active",
    mode: process.env.MODE || "testnet",
  });
});

// ✅ Delta Exchange Connect route
app.get("/api/connect", async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.query;
    if (!apiKey || !apiSecret) {
      return res
        .status(400)
        .json({ success: false, error: "Missing API credentials" });
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

    res.json({
      success: true,
      mode: BASE_URL.includes("testnet") ? "testnet" : "prod",
      result: data.result || [],
      count: data.result?.length || 0,
    });
  } catch (err) {
    console.error("❌ Error in /api/connect:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ SurgiAlgo proxy running on port ${PORT}`)
);
