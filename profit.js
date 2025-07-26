
const crypto = require('crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { apiKey, apiSecret } = req.body;
  if (!apiKey || !apiSecret) return res.status(400).json({ error: 'Missing keys' });

  const timestamp = Date.now().toString();
  const query = `timestamp=${timestamp}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(query).digest('hex');

  const url = `https://open-api.bingx.com/openApi/swap/v2/user/profitOrLoss?${query}&signature=${signature}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-BX-APIKEY': apiKey }
    });
    const result = await response.json();

    if (!result || !result.data) {
      return res.status(500).json({ error: 'Invalid API response', result });
    }

    // Mock transformace odpovědi
    const data = result.data.slice(-10).map(entry => ({
      date: entry.updateTime?.split(" ")[0] || "unknown",
      profit: Number(entry.realizedProfit) || 0
    }));

    const monthlyProfit = data.reduce((sum, d) => sum + d.profit, 0);
    const projected = Math.round(monthlyProfit / Math.min(data.length, 7) * 30);
    const winrate = Math.round((data.filter(d => d.profit > 0).length / data.length) * 100);
    const fees = result.data.reduce((acc, item) => acc + (Number(item.totalFee) || 0), 0);

    res.status(200).json({ dailyProfits: data, monthlyProfit, projected, winrate, fees });
  } catch (err) {
    res.status(500).json({ error: 'API call failed', details: err.toString() });
  }
}
