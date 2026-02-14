import express from "express";
import fetch from "node-fetch";

const app = express();

/* ========= HTML ========= */

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
  const id = document.getElementById("orderId").value.trim();
  const ref = document.getElementById("orderRef").value.trim();

  if (!id && !ref) {
    alert("Order ID oder Reference fehlt");
    return;
  }

  const params = new URLSearchParams();
  if (id) params.set("orderId", id);
  else params.set("orderReference", ref);

  document.getElementById("out").textContent = "Lade...";

  try {
    const res = await fetch("/api/status?" + params.toString());
    const data = await res.json();
    document.getElementById("out").textContent =
      JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("out").textContent =
      "Fehler: " + err.message;
  }
}
</script>
</body>
</html>
`;

/* ========= ROUTES ========= */

// HTML anzeigen
app.get("/", (req, res) => {
  res.send(html);
});

// Proxy zur Peecho Production API
app.get("/api/status", async (req, res) => {
  const { orderId, orderReference } = req.query;

  if (!orderId && !orderReference) {
    return res.status(400).json({
      error: "orderId oder orderReference fehlt"
    });
  }

  if (!process.env.PEECHO_API_KEY) {
    return res.status(500).json({
      error: "PEECHO_API_KEY nicht gesetzt"
    });
  }

  const url = new URL(
    "https://www.peecho.com/rest/v3/order/details"
  );

  url.searchParams.set(
    "merchantApiKey",
    process.env.PEECHO_API_KEY
  );

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
    res.status(500).json({
      error: "Fehler bei Peecho Anfrage",
      details: err.message
    });
  }
});

/* ========= SERVER START ========= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
