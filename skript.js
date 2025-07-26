document.addEventListener('DOMContentLoaded', () => {
    const pnlTableBody = document.querySelector('#pnl-table tbody');
    const monthlyProfitEl = document.getElementById('monthly-profit');
    const projectedProfitEl = document.getElementById('projected-profit');
    const winrateEl = document.getElementById('winrate');
    const monthlyFeesEl = document.getElementById('monthly-fees');
    const lastUpdatedEl = document.getElementById('last-updated');
    const chartCanvas = document.getElementById('pnl-chart').getContext('2d');

    let pnlChart;

    /**
     * DŮLEŽITÉ: PROPOJENÍ S REÁLNÝM API
     * Tato funkce `getDummyData` pouze simuluje data pro ukázku.
     * V reálné aplikaci byste místo ní volali svůj backend (server),
     * který by bezpečně komunikoval s BingX API a vracel data v podobném formátu.
     * Váš kód by pak vypadal nějak takto:
     *
     * async function fetchData() {
     * try {
     * const response = await fetch('https://adresa-vaseho-serveru.cz/api/data');
     * if (!response.ok) throw new Error('Chyba při načítání dat');
     * const data = await response.json();
     * return data;
     * } catch (error) {
     * console.error('API Error:', error);
     * return null; // V případě chyby vrátit null
     * }
     * }
     */
    function getDummyData() {
        // Simulovaná data pro 10 dní
        const dailyPnl = [];
        let cumulativePnl = 1500; // Počáteční simulovaný zisk
        for (let i = 9; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const profit = Math.random() * 200 - 80; // Náhodný zisk/ztráta mezi -80 a 120
            cumulativePnl += profit;
            dailyPnl.push({
                date: date.toISOString().split('T')[0],
                pnl: parseFloat(profit.toFixed(2)),
                cumulativePnl: parseFloat(cumulativePnl.toFixed(2))
            });
        }

        const monthlyProfit = dailyPnl.reduce((sum, day) => sum + day.pnl, 0);
        const last7daysAvg = dailyPnl.slice(-7).reduce((sum, day) => sum + day.pnl, 0) / 7;
        const projectedProfit = last7daysAvg * 30;

        return {
            dailyPnl,
            monthlyProfit: parseFloat(monthlyProfit.toFixed(2)),
            projectedProfit: parseFloat(projectedProfit.toFixed(2)),
            winrate: parseFloat((Math.random() * (85 - 55) + 55).toFixed(2)), // Náhodný winrate mezi 55% a 85%
            monthlyFees: parseFloat((Math.random() * 200 + 50).toFixed(2)) // Náhodné poplatky
        };
    }

    function updateDashboard() {
        // V reálné aplikaci byste zde volali `fetchData()` místo `getDummyData()`
        const data = getDummyData();

        if (!data) {
             // Zde můžete zobrazit chybovou hlášku v UI
            return;
        }

        // 1. Aktualizace tabulky denního zisku
        pnlTableBody.innerHTML = '';
        data.dailyPnl.slice().reverse().forEach(day => {
            const row = document.createElement('tr');
            const profitClass = day.pnl >= 0 ? 'profit-positive' : 'profit-negative';

            row.innerHTML = `
                <td>${new Date(day.date).toLocaleDateString('cs-CZ')}</td>
                <td class="${profitClass}">${day.pnl.toFixed(2)} USDT</td>
            `;
            pnlTableBody.appendChild(row);
        });

        // 2. Aktualizace měsíčních statistik
        monthlyProfitEl.textContent = `${data.monthlyProfit.toFixed(2)} USDT`;
        monthlyProfitEl.className = data.monthlyProfit >= 0 ? 'positive' : 'negative';

        projectedProfitEl.textContent = `${data.projectedProfit.toFixed(2)} USDT`;
        projectedProfitEl.className = data.projectedProfit >= 0 ? 'positive' : 'negative';
        
        winrateEl.textContent = `${data.winrate}%`;
        monthlyFeesEl.textContent = `${data.monthlyFees.toFixed(2)} USDT`;

        // 3. Aktualizace grafu
        const chartLabels = data.dailyPnl.map(d => new Date(d.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric'}));
        const chartData = data.dailyPnl.map(d => d.cumulativePnl);
        
        if (pnlChart) {
            pnlChart.data.labels = chartLabels;
            pnlChart.data.datasets[0].data = chartData;
            pnlChart.update();
        } else {
            pnlChart = new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Celkový zisk (USDT)',
                        data: chartData,
                        borderColor: 'rgba(0, 207, 232, 1)',
                        backgroundColor: 'rgba(0, 207, 232, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(0, 207, 232, 1)',
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                    }
                }
            });
        }
        
        // 4. Aktualizace času
        lastUpdatedEl.textContent = new Date().toLocaleTimeString('cs-CZ');
    }

    // Spustit poprvé a pak každou minutu
    updateDashboard();
    setInterval(updateDashboard, 60000); // 60000 ms = 1 minuta
});
