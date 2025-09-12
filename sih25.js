const messageModal = document.getElementById('message-modal');
const messageContent = document.getElementById('message-content');
function showMessage(text, type = 'success') {
    messageContent.textContent = text;
    messageContent.className = 'rounded-lg shadow-xl p-4 text-center font-medium pointer-events-auto transform transition-transform duration-300 ease-out ';
    if (type === 'success') {
        messageContent.classList.add('bg-green-700', 'text-white');
    } else if (type === 'error') {
        messageContent.classList.add('bg-red-700', 'text-white');
    }
    messageModal.classList.remove('opacity-0');
    messageModal.classList.add('opacity-100');
    messageContent.classList.remove('translate-y-full');
    messageContent.classList.add('translate-y-0');

    setTimeout(() => {
        messageModal.classList.remove('opacity-100');
        messageModal.classList.add('opacity-0');
        messageContent.classList.remove('translate-y-0');
        messageContent.classList.add('translate-y-full');
    }, 3000);
}

const dataPoints = [];
const maxDataPoints = 20;
let isSimulating = false;
let simulationInterval = null;

const chartColors = {
    tempLine: '#4f46e5',
    tempFill: 'rgba(79, 70, 229, 0.1)',
    humLine: '#0ea5e9',
    humFill: 'rgba(14, 165, 233, 0.1)',
    pressureLine: '#10b981',
    pressureFill: 'rgba(16, 185, 129, 0.1)',
    grid: '#374151',
    font: '#9ca3af'
};

function drawSingleChart(canvasId, dataKey, lineStyle, fillStyle) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    if (!canvas.parentElement) return;

    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = chartColors.font;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'transparent';
    
    if (dataPoints.length === 0) return;

    // Find min/max values
    const values = dataPoints.map(p => p[dataKey]);
    const minValue = Math.min(...values) - 1;
    const maxValue = Math.max(...values) + 1;
    const range = maxValue - minValue;

    // Draw grid lines and labels
    ctx.strokeStyle = chartColors.grid;
    ctx.fillStyle = chartColors.font;
    ctx.font = '12px Inter';
    for (let i = 0; i <= 5; i++) {
        const y = height - (i / 5) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        const valueLabel = (minValue + (i / 5) * range).toFixed(1);
        ctx.fillText(valueLabel, 5, y - 5);
    }

    // Draw data line
    ctx.beginPath();
    ctx.strokeStyle = lineStyle;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    // Draw a smooth curve
    ctx.moveTo(0, height - ((dataPoints[0][dataKey] - minValue) / range) * height);
    for (let i = 1; i < dataPoints.length; i++) {
        const x = (i / (dataPoints.length - 1)) * width;
        const y = height - ((dataPoints[i][dataKey] - minValue) / range) * height;
        ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill area below the line
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
}

function drawCharts() {
    drawSingleChart('tempChartCanvas', 'temperature', chartColors.tempLine, chartColors.tempFill);
    drawSingleChart('humChartCanvas', 'humidity', chartColors.humLine, chartColors.humFill);
    drawSingleChart('pressureChartCanvas', 'pressure', chartColors.pressureLine, chartColors.pressureFill);
}

function fetchData() {
    const temp = (Math.random() * 5 + 20).toFixed(2);
    const hum = (Math.random() * 10 + 40).toFixed(2);
    const pressure = (Math.random() * 5 + 1000).toFixed(2);
    const ping = (Math.random() * 50 + 20).toFixed(0);

    return {
        timestamp: new Date().toLocaleTimeString(),
        temperature: parseFloat(temp),
        humidity: parseFloat(hum),
        pressure: parseFloat(pressure),
        ping: parseInt(ping)
    };
}

function updateDashboard(data) {
    document.getElementById('temp-value').textContent = data.temperature;
    document.getElementById('hum-value').textContent = data.humidity;
    document.getElementById('pressure-value').textContent = data.pressure;
    document.getElementById('ping-value').textContent = data.ping;
    document.getElementById('last-updated').textContent = `Last updated: ${data.timestamp}`;
}

function simulationLoop() {
    const newDataPoint = fetchData();
    if (dataPoints.length >= maxDataPoints) {
        dataPoints.shift();
    }
    dataPoints.push(newDataPoint);
    updateDashboard(newDataPoint);
    drawCharts();
}

// Start initial data load and drawing
simulationLoop();

window.addEventListener('resize', drawCharts);

// --- Event Listeners and UI Logic ---
const simulateBtn = document.getElementById('simulate-btn');
simulateBtn.addEventListener('click', () => {
    if (isSimulating) {
        isSimulating = false;
        simulateBtn.textContent = 'Simulate Live Data';
        showMessage("Live data simulation stopped.", "error");
        clearInterval(simulationInterval);
    } else {
        isSimulating = true;
        simulateBtn.textContent = 'Stop Simulation';
        showMessage("Live data simulation started.", "success");
        const speed = document.getElementById('speed-slider').value;
        simulationInterval = setInterval(simulationLoop, speed);
    }
});

const clearBtn = document.getElementById('clear-btn');
clearBtn.addEventListener('click', () => {
    dataPoints.length = 0;
    drawCharts();
    showMessage("Data history cleared.", "success");
});

const downloadBtn = document.getElementById('download-btn');
downloadBtn.addEventListener('click', () => {
    const dataToDownload = JSON.stringify(dataPoints, null, 2);
    const blob = new Blob([dataToDownload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hardware_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage("Data downloaded as JSON.", "success");
});

const speedSlider = document.getElementById('speed-slider');
const speedValueSpan = document.getElementById('speed-value');
speedSlider.addEventListener('input', (e) => {
    const newSpeed = e.target.value;
    speedValueSpan.textContent = `${(newSpeed / 1000).toFixed(1)}s`;
    if (isSimulating) {
        clearInterval(simulationInterval);
        simulationInterval = setInterval(simulationLoop, newSpeed);
    }
});

// --- Menu Toggle Logic ---
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

menuToggle.addEventListener('click', () => {
    if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
    } else {
        mobileMenu.classList.add('hidden');
    }
});
