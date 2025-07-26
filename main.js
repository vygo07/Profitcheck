async function createApp() {
  const app = document.getElementById('app');

  const apiKey = localStorage.getItem('bingx_api_key') || '';
  const apiSecret = localStorage.getItem('bingx_api_secret') || '';

  if (!apiKey || !apiSecret) {
    app.innerHTML = `
      <h2>Zadejte BingX API Key a Secret</h2>
      <input id="apiKey" placeholder="API Key" />
      <input id="apiSecret" placeholder="API Secret" type="password" />
      <button id="save">Uložit</button>
    `;
    document.getElementById('save').addEventListener('click', () => {
      localStorage.setItem('bingx_api_key', document.getElementById('apiKey').value);
      localStorage.setItem('bingx_api_secret', document.getElementById('apiSecret').value);
      location.reload();
    });
    return;
  }

  async function fetchData() {
    const res = await fetch('/api/profit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey,
        apiSecret
      })
    });
    const data = await res.json();
    renderTable(data);
  }

  function renderTable(data) {
    let html = '<h1>BingX Profit Tracker</h1>';
    html += '<table class="table"><tr><th>Date</th><th>Profit</th></tr>';
    data.dailyProfits.forEach((item) => {
      const cls = item.profit >= 0 ? 'positive' : 'negative';
      html += `<tr class="${cls}"><td>${item.date}</td><td>${item.profit}</td></tr>`;
    });
    html += '</table>';
    html += `<p>Monthly Profit: ${data.monthlyProfit}</p>`;
    html += `<p>Projected Monthly: ${data.projected}</p>`;
    html += `<p>Win Rate: ${data.winrate}%</p>`;
    html += `<p>Fees: ${data.fees}</p>`;
    app.innerHTML = html;
  }

  fetchData();
  setInterval(fetchData, 60000);
}

window.addEventListener('DOMContentLoaded', createApp);
