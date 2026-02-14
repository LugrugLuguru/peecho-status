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
    .box { background:white; padding:20px; max-width:700px; border-radius:10px }
    input, button { width:100%; padding:10px; margin-top:10px }
    table { width:100%; border-collapse:collapse; margin-top:20px }
    td { padding:8px; border-bottom:1px solid #ddd }
    td:first-child { font-weight:bold; width:40% }
    .status {
      font-weight:bold;
      padding:4px 8px;
      border-radius:6px;
      display:inline-block;
    }
    .PRINTING { background:#fff3cd; color:#856404 }
    .SHIPPED { background:#d4edda; color:#155724 }
    .DELIVERED { background:#cce5ff; color:#004085 }
    .ERROR { background:#f8d7da; color:#721c24 }
  </style>
</head>
<body>
  <div class="box">
    <h2>Peecho – Bestellstatus</h2>

    <input id="orderId" placeholder="Order ID">
    <input id="orderRef" placeholder="ODER Order Reference">

    <button onclick="check()">Status abfragen</button>

    <div id="result"></div>
  </div>

<script>
async function check() {
  const id = orderId.value.trim();
  const ref = orderRef.value.trim();
  const result = document.getElementById("result");

  if (!id && !ref) {
    alert("Order ID oder Reference fehlt");
    return;
  }

  const params = new URLSearchParams();
  if (id) params.set("orderId", id);
  else params.set("orderReference", ref);

  result.innerHTML = "Lade...";

  try {
    const res = await fetch("/api/status?" + params.toString());
    const data = await res.json();

    if (data.error) {
      result.innerHTML = "<b>Fehler:</b> " + data.error;
      return;
    }

    const status = data.status || "UNBEKANNT";

    result.innerHTML = \`
      <table>
        <tr><td>Order ID</td><td>\${data.order_id ?? "-"}</td></tr>
        <tr><td>Order Reference</td><td>\${data.order_reference ?? "-"}</td></tr>
        <tr>
          <td>Status</td>
          <td><span class="status \${status}">\${status}</span></td>
        </tr>
        <tr><td>Produkt</td><td>\${data.product_type ?? "-"}</td></tr>
        <tr><td>Erstellt</td><td>\${data.created ?? "-"}</td></tr>
        <tr><td>Tracking</td><td>\${data.tracking_code ?? "—"}</td></tr>
      </table>
    \`;
  } catch (err) {
    result.innerHTML = "Fehler: " + err.message;
  }
}
</script>
</body>
</html>
`;

/* ========= ROUTES ========= */

app.get("/", (req, res) => {
  res.send(html);
});

app.get("/api/status", async (req, res) => {
  const { orderId, orderReference } = req.query;

  if (!orderId && !orderReference) {
    return res.status(400).json({ error: "orderId oder orderReference fehlt" });
  }

  const url = new URL("https://www.peecho.com/rest/v3/order/details");
  url.searchParams.set("merchantApiKey", process.env.PEECHO_API_KEY);

  if (orderId) url.searchParams.set("orderId", orderId);
  else url.searchParams.set("orderReference", orderReference);

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ========= SERVER ========= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
