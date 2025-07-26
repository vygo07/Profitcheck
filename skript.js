// Uložení API klíčů do localStorage
function saveKeys() {
    const apiKey = document.getElementById('apiKey').value;
    const secretKey = document.getElementById('secretKey').value;
    localStorage.setItem('bingxApiKey', apiKey);
    localStorage.setItem('bingxSecretKey', secretKey);
    alert('Klíče uloženy!');
    fetchData();
}

// Funkce pro vytvoření podpisu pro BingX API
function createSignature(secretKey, params) {
    const queryString = new URLSearchParams(params).toString();
    return CryptoJS.HmacSHA256(queryString, secretKey).toString(CryptoJS.enc.Hex);
}

// Funkce pro načtení dat z BingX API
async function fetchData() {
    const apiKey = localStorage.getItem('bingxApiKey');
    const secretKey = localStorage.getItem('bingxSecretKey');
    if (!apiKey || !secretKey) {
        alert('Prosím, vložte API a Secret klíč.');
        return;
    }

    const timestamp = Date.now();
    const params = { timestamp };
    const signature = createSignature(secretKey, params);
    const url = `https://api.bingx.com/api/v1/trade/history?timestamp=${timestamp}&signature=${signature}`;

    try {
        const response = await fetch(url, {
            headers: { 'X-BX-APIKEY': apiKey }
        });
        const data = await response.json();

        // Předpokládáme, že data obsahují seznam obchodů
        const trades = data.data;
        processTrades(trades);
    } catch (error) {
        console.error('Chyba při načítání dat:', error);
        // Mock data pro testování
        const mockTrades = [
            { time: '2025-07-25T10:00:00Z', realizedPnl: 100, fee: 1 },
            { time: '2025-07-24T10:00:00Z', realizedPnl: -50, fee: 0.5 },
            { time: '2025-07-23T10:00:00Z', realizedPnl: 75, fee: 0.8 },
            { time: '2025-07-22T10:00:00Z', realizedPnl: 120, fee: 1.2 },
            { time: '2025-07-21T10:00:00Z', realizedPnl: -30, fee: 0.4 },
            { time: '2025-07-20T10:00:00Z', realizedPnl: 200, fee: 2 },
            { time: '2025-07-19T10:00:00Z', realizedPnl: 50, fee: 0.7 },
            { time: '2025-07-18T10:00:00Z', realizedPnl: -20, fee: 0.3 },
            { time: '2025-07-17T10:00:00Z', realizedPnl: 80, fee: 0.9 },
            { time: '2025-07-16T10:00:00Z', realizedPnl: 150, fee: 1.5 }
        ];
        processTrades(mockTrades);
    }
}

// Zpracování obchodních dat
function processTrades(trades) {
    const today = new Date();
    const dailyProfits = {};
    let monthlyProfit = 0;
    let monthlyFees = 0;
    let winTrades = 0;
    let totalTrades = 0;

    // Agregace dat podle dní
    trades.forEach(trade => {
        const tradeDate = new Date(trade.time).toISOString().split('T')[0];
        const profit = parseFloat(trade.realizedPnl);
        const fee = parseFloat(trade.fee);

        if (!dailyProfits[tradeDate]) {
            dailyProfits[tradeDate] = { profit: 0, fees: 0 };
        }
        dailyProfits[tradeDate].profit += profit;
        dailyProfits[tradeDate].fees += fee;

        monthlyProfit += profit;
        monthlyFees += fee;

        if (profit > 0) winTrades++;
        totalTrades++;
    });

    // Zobrazení tabulky posledních 10 dní
    const tableBody = document.getElementById('profitTableBody');
    tableBody.innerHTML = '';
    const last10Days = Object.keys(dailyProfits)
        .sort((a, b) => new Date(b) - new Date(a))
        .slice(0, 10);

    last10Days.forEach(date => {
        const profit = dailyProfits[date].profit.toFixed(2);
        const row = document.createElement('tr');
        row.className = profit > 0 ? 'positive' : 'negative';
        row.innerHTML = `<td>${date}</td><td>${profit} USD</td>`;
        tableBody.appendChild(row);
    });

    // Výpočet pravděpodobného měsíčního zisku (průměr za 7 dní * 30)
    const last7Days = Object.keys(dailyProfits)
        .sort((a, b) => new Date(b) - new Date(a))
        .slice(0, 7);
    const avgDailyProfit = last7Days.reduce((sum, date) => sum + dailyProfits[date].profit, 0) / 7;
    const projectedProfit = (avgDailyProfit * 30).toFixed(2);

    // Zobrazení statistik
    document.getElementById('monthlyProfit').textContent = monthlyProfit.toFixed(2);
    document.getElementById('projectedProfit').textContent = projectedProfit;
    document.getElementById('winrate').textContent = ((winTrades / totalTrades) * 100).toFixed(2) + '%';
    document.getElementById('monthlyFees').textContent = monthlyFees.toFixed(2);

    // Vytvoření grafu
    const ctx = document.getElementById('profitChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: last10Days.reverse(),
            datasets: [{
                label: 'Denní zisk (USD)',
                data: last10Days.map(date => dailyProfits[date].profit),
                borderColor: '#007aff',
                backgroundColor: 'rgba(0, 122, 255, 0.2)',
                fill: true,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Aktualizace dat každou minutu
setInterval(fetchData, 60000);

// Načtení dat při prvním spuštění
fetchData();
