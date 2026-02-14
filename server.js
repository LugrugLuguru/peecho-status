import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.get("/api/status", async (req, res) => {
  const { orderId, orderReference } = req.query;

  if (!orderId && !orderReference) {
    return res.status(400).json({ error: "orderId oder orderReference fehlt" });
  }

  const url = new URL("https://www.peecho.com/rest/v3/order/details");
  url.searchParams.set("merchantApiKey", process.env.PEECHO_API_KEY);

  if (orderId) {
    url.searchParams.set("orderId", orderId);
  } else {
    url.searchParams.set("orderReference", orderReference);
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Peecho API Fehler", details: e.message });
  }
});

app.listen(3000, () => {
  console.log("Server läuft auf Port 3000");
});
