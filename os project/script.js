// Base URL for API
const API_URL = '/api';

// DOM Elements
const urlForm = document.getElementById('urlForm');
const emailForm = document.getElementById('emailForm');
const contactForm = document.getElementById('contactForm');

// Helper for UI loading state
function setLoading(buttonId, loaderId, isLoading) {
    const btn = document.getElementById(buttonId);
    const loader = document.getElementById(loaderId);
    if(btn) btn.style.display = isLoading ? 'none' : 'inline-block';
    if(loader) loader.style.display = isLoading ? 'block' : 'none';
}


function displayResult(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.style.display = 'block';
    container.className = `result-box ${data.result === 'Phishing' ? 'result-phishing' : 'result-safe'}`;

    const color = data.result === 'Phishing' ? 'var(--neon-red)' : 'var(--neon-green)';
    
    // Confidence bar HTML
    let reasonsHtml = '';
    if(data.reasons && data.reasons.length > 0) {
        reasonsHtml = `<ul style="margin-top: 15px; margin-left: 20px; color: var(--text-muted); font-family: var(--font-mono);">
            ${data.reasons.map(r => `<li>${r}</li>`).join('')}
        </ul>`;
    }

    container.innerHTML = `
        <h3 style="color: ${color};"><span class="mono">[${data.result.toUpperCase()}]</span> Detected</h3>
        <p style="margin-top: 10px;">Risk Level: <strong>${data.risk}</strong></p>
        <div style="margin-top: 15px;">
            <p>AI Confidence: ${data.confidence}%</p>
            <div class="confidence-bar">
                <div class="confidence-fill" style="background-color: ${color}; width: 0%"></div>
            </div>
        </div>
        ${reasonsHtml}
    `;

    // Animate confidence bar
    setTimeout(() => {
        const fill = container.querySelector('.confidence-fill');
        if(fill) fill.style.width = `${data.confidence}%`;
    }, 100);
}


if (urlForm) {
    urlForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('urlInput').value;
        const resultContainer = 'urlResult';
        
        setLoading('urlSubmitBtn', 'urlLoader', true);
        document.getElementById(resultContainer).style.display = 'none';
        
        try {
            const response = await fetch(`${API_URL}/check-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await response.json();
            displayResult(resultContainer, data);
        } catch (error) {
            alert('Error connecting to server.');
        } finally {
            setLoading('urlSubmitBtn', 'urlLoader', false);
        }
    });
}

if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailContent = document.getElementById('emailInput').value;
        const resultContainer = 'emailResult';
        
        setLoading('emailSubmitBtn', 'emailLoader', true);
        document.getElementById(resultContainer).style.display = 'none';

        try {
            const response = await fetch(`${API_URL}/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailContent })
            });
            const data = await response.json();
            displayResult(resultContainer, data);
        } catch (error) {
            alert('Error connecting to server.');
        } finally {
            setLoading('emailSubmitBtn', 'emailLoader', false);
        }
    });
}

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        const btn = contactForm.querySelector('button');
        btn.textContent = 'Sending...';

        try {
            const response = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });
            const data = await response.json();
            if(data.success) {
                contactForm.innerHTML = `<h3 class="text-green text-center">Message sent securely.</h3>`;
            }
        } catch(error) {
            alert('Error sending message');
            btn.textContent = 'Send Secure Message';
        }
    });
}

// Tab switching logic for detect page
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    
    event.target.classList.add('active');
    document.getElementById(tabId).style.display = 'block';
}

// Load Dashboard Data
async function loadDashboard() {
    const statsTotal = document.getElementById('statsTotal');
    if(!statsTotal) return; // Not on dashboard page

    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();

        // Animate counter logic
        animateValue('statsTotal', 0, data.scans.total, 1000);
        animateValue('statsPhishing', 0, data.scans.phishing, 1000);
        animateValue('statsSafe', 0, data.scans.safe, 1000);

        loadCharts(data.scans);
        loadHistory(data.history);
    } catch(err) {
        console.error("Error loading dashboard data:", err);
    }
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj || end === 0) {
        if(obj) obj.innerHTML = end;
        return;
    }
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function loadCharts(scans) {
    const ctx = document.getElementById('scanChart');
    if(!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Safe', 'Phishing'],
            datasets: [{
                data: [scans.safe, scans.phishing],
                backgroundColor: ['#00ffcc', '#ff3333'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#f0f0f0', font: { family: 'Fira Code' } } }
            }
        }
    });
}

function loadHistory(history) {
    const tbody = document.getElementById('historyBody');
    if(!tbody) return;

    tbody.innerHTML = '';
    
    if(history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No scans performed yet.</td></tr>`;
        return;
    }

    history.forEach(item => {
        const dateObj = new Date(item.date);
        const color = item.result === 'Phishing' ? 'color: var(--neon-red);' : 'color: var(--neon-green);';
        tbody.innerHTML += `
            <tr>
                <td>${item.type}</td>
                <td><span class="mono">${item.target}</span></td>
                <td style="${color} font-weight: bold;">[${item.result}]</td>
                <td>${dateObj.toLocaleTimeString()} - ${dateObj.toLocaleDateString()}</td>
            </tr>
        `;
    });
}

// On page load 
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});
