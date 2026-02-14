import express from "express";
import fetch from "node-fetch";

const app = express();

/* ========= HTML direkt im Code ========= */
const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Peecho Status</title>
  <style>
    body { font-family: Arial; background:#f4f6fb; padding:40px }
    .box { background:white; padding:20px; max-width:600px; border-radius:10px }
    input, button { width:100%; padding:10px; margin-top:10px }
    pre { background:#111; color:#0f0; padding:15px; margin-top:20px }
  </style>
</head>
<body>
  <div class="box">
    <h2>Peecho – Bestellstatus</h2>

    <input id="orderId" placeholder="Order ID">
    <input id="orderRef" placeholder="ODER Order Reference">

    <button onclick="check()">Status abfragen</button>
    <pre id="out"></pre>
  </div>

<script>
async function check() {
  const id = orderId.value.trim();
  const ref = orderRef.value.trim();

  if (!id && !ref) {
    alert("Order ID oder Reference fehlt");
    return;
  }

  const params = new URLSearchParams();
  if (id) params.set("orderId", id);
  else params.set("orderReference", ref);

  out.textContent = "Lade...";
  const res = await fetch("/api/status?" + params.toString());
  const data = await res.json();
  out.textContent = JSON.stringify(data, null, 2);
}
</script>
</body>
</html>
`;

/* ========= ROUTES ========= */

// Root → HTML
app.get("/", (req, res) => {
  res.send(html);
});

// API Proxy → Peecho
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
