// Configuration
const DATA_URL = 'data/latest.json';
const HISTORY_URL = 'data/history.json';
const REFRESH_INTERVAL = 60 * 1000; // Refresh every minute

// DOM Elements
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const playerCount = document.getElementById('player-count');
const serverTime = document.getElementById('server-time');
const uptimeElement = document.getElementById('uptime');
const computerId = document.getElementById('computer-id');
const playerList = document.getElementById('player-list');
const lastUpdated = document.getElementById('last-updated');
let playerActivityChart;

// Initialize the dashboard
async function initDashboard() {
    await updateDashboard();
    setupChart();
    
    // Set up periodic refresh
    setInterval(updateDashboard, REFRESH_INTERVAL);
}

// Update dashboard with latest data
async function updateDashboard() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        updateStats(data);
        updatePlayerList(data.players || []);
        updateLastUpdated(data.last_updated);
        
        // Update server status
        updateServerStatus(true);
        
        // Update chart data
        await updateChart();
    } catch (error) {
        console.error('Error updating dashboard:', error);
        updateServerStatus(false);
    }
}

// Update server status indicator
function updateServerStatus(isOnline) {
    if (isOnline) {
        statusIndicator.className = 'online';
        statusText.textContent = 'Online';
    } else {
        statusIndicator.className = 'offline';
        statusText.textContent = 'Offline';
    }
}

// Update statistics
function updateStats(data) {
    playerCount.textContent = data.playerCount || 0;
    
    // Format server time
    const rawTime = data.serverTime || 0;
    const hours = Math.floor(rawTime / 1000);
    const minutes = Math.floor((rawTime % 1000) / 16.6);
    serverTime.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
    
    // Calculate uptime
    const uptime = data.computerUptime || 0;
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    uptimeElement.textContent = `${uptimeHours}h ${uptimeMinutes}m`;
    
    // Computer ID
    computerId.textContent = data.computerID || 'Unknown';
}

// Update player list
function updatePlayerList(players) {
    playerList.innerHTML = '';
    
    if (players.length === 0) {
        const noPlayers = document.createElement('p');
        noPlayers.className = 'no-players';
        noPlayers.textContent = 'No players online';
        playerList.appendChild(noPlayers);
        return;
    }
    
    players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        const avatar = document.createElement('img');
        avatar.className = 'player-avatar';
        avatar.src = `https://mc-heads.net/avatar/${player}/32`;
        avatar.alt = player;
        
        const playerName = document.createElement('span');
        playerName.textContent = player;
        
        playerItem.appendChild(avatar);
        playerItem.appendChild(playerName);
        playerList.appendChild(playerItem);
    });
}

// Update last updated timestamp
function updateLastUpdated(timestamp) {
    if (!timestamp) return;
    
    const date = new Date(timestamp * 1000);
    lastUpdated.textContent = date.toLocaleString();
}

// Set up player activity chart
function setupChart() {
    const ctx = document.getElementById('player-activity-chart').getContext('2d');
    
    playerActivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Players Online',
                data: [],
                backgroundColor: 'rgba(42, 157, 143, 0.2)',
                borderColor: 'rgba(42, 157, 143, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(42, 157, 143, 1)',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#aaa'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#aaa',
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ddd'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#aaa',
                    bodySpacing: 4,
                    padding: 12
                }
            }
        }
    });
}

// Update chart with history data
async function updateChart() {
    try {
        const response = await fetch(HISTORY_URL);
        if (!response.ok) return;
        
        const data = await response.json();
        const updates = data.updates || [];
        
        if (updates.length === 0) return;
        
        // Format data for chart
        const labels = updates.map(update => {
            const date = new Date(update.timestamp * 1000);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        
        const counts = updates.map(update => update.player_count || 0);
        
        // Update chart data
        playerActivityChart.data.labels = labels;
        playerActivityChart.data.datasets[0].data = counts;
        playerActivityChart.update();
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Start the dashboard
document.addEventListener('DOMContentLoaded', initDashboard);
