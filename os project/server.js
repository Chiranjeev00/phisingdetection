const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database Helper Functions
function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { scans: { total: 0, phishing: 0, safe: 0 }, history: [], messages: [] };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Logic for URL Check
app.post('/api/check-url', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    let reasons = [];
    let risk = "Low";
    let isPhishing = false;
    let confidence = 95; // Default safe confidence

    // 1. Length Check
    if (url.length > 50) {
        reasons.push("URL is unusually long (over 50 characters)");
        isPhishing = true;
    }

    // 2. Keywords
    const suspiciousKeywords = ['login', 'verify', 'bank', 'free', 'update', 'secure', 'account', 'auth'];
    const lowerUrl = url.toLowerCase();
    suspiciousKeywords.forEach(word => {
        if (lowerUrl.includes(word)) {
            reasons.push(`Contains suspicious keyword: '${word}'`);
            isPhishing = true;
        }
    });

    // 3. Dot count
    const dotCount = (url.match(/\./g) || []).length;
    if (dotCount > 3) {
         reasons.push(`Too many subdomains (${dotCount} dots found)`);
         isPhishing = true;
    }

    // 4. HTTPS Check
    if (!lowerUrl.startsWith('https://')) {
         reasons.push("Does not use secure HTTPS protocol");
         isPhishing = true;
    }

    if (isPhishing) {
        risk = reasons.length > 2 ? "High" : "Medium";
        confidence = Math.min(99, 60 + (reasons.length * 12)); 
    } else {
        confidence = Math.floor(Math.random() * (99 - 95 + 1)) + 95; // 95 to 99
    }

    const resultData = {
        result: isPhishing ? "Phishing" : "Safe",
        confidence: confidence,
        risk: risk,
        reasons: isPhishing ? reasons : ["No suspicious patterns found", "Uses secure protocols"]
    };

    // Update DB
    const db = readDB();
    db.scans.total++;
    if (isPhishing) db.scans.phishing++;
    else db.scans.safe++;
    
    db.history.unshift({
        type: 'URL',
        target: url,
        result: resultData.result,
        date: new Date().toISOString()
    });
    // Keep max 50 history logs
    if (db.history.length > 50) db.history.pop();
    
    writeDB(db);

    // Fake network delay for animated feeling
    setTimeout(() => {
        res.json(resultData);
    }, 1500);
});

// Logic for Email Check
app.post('/api/check-email', (req, res) => {
    const { emailContent } = req.body;
    if (!emailContent) return res.status(400).json({ error: "Email content is required" });

    let reasons = [];
    let isPhishing = false;
    let confidence = 98; // Default safe

    const lowerContent = emailContent.toLowerCase();

    // 1. Urgent words
    const urgentWords = ['urgent', 'act now', 'verify', 'immediate action', 'suspended', 'password expiry', 'action required'];
    urgentWords.forEach(word => {
        if (lowerContent.includes(word)) {
            reasons.push(`Contains urgency/threat keyword: '${word}'`);
            isPhishing = true;
        }
    });

    // 2. Suspicious links (mock logic: finding generic http inside text)
    if (lowerContent.includes('http://') && !lowerContent.includes('https://')) {
        reasons.push("Contains insecure HTTP links");
        isPhishing = true;
    }

    // 3. Greeting pattern
    if (lowerContent.includes('dear customer') || lowerContent.includes('dear account holder') || lowerContent.includes('hello user')) {
         reasons.push("Uses generic non-personalized greeting");
         isPhishing = true;
    }

    let risk = "Low";
    if (isPhishing) {
        risk = reasons.length >= 2 ? "High" : "Medium";
        confidence = Math.min(99, 70 + (reasons.length * 8)); 
    } else {
        confidence = Math.floor(Math.random() * (99 - 95 + 1)) + 95;
    }

    const resultData = {
        result: isPhishing ? "Phishing" : "Safe",
        confidence: confidence,
        risk: risk,
        reasons: isPhishing ? reasons : ["Natural language patterns normal", "No urgency detected"]
    };

    // Update DB
    const db = readDB();
    db.scans.total++;
    if (isPhishing) db.scans.phishing++;
    else db.scans.safe++;
    
    // Create short snippet for target
    let targetSnippet = emailContent.substring(0, 30);
    if(emailContent.length > 30) targetSnippet += "...";

    db.history.unshift({
        type: 'Email',
        target: targetSnippet,
        result: resultData.result,
        date: new Date().toISOString()
    });
    if (db.history.length > 50) db.history.pop();
    
    writeDB(db);

    setTimeout(() => {
        res.json(resultData);
    }, 2000);
});

// Stats API
app.get('/api/stats', (req, res) => {
    const db = readDB();
    res.json({
        scans: db.scans,
        history: db.history
    });
});

// Contact API
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: "All fields are required" });

    const db = readDB();
    db.messages.push({
        name, email, message, date: new Date().toISOString()
    });
    writeDB(db);

    res.json({ success: true, message: "Message received successfully." });
});

// Fallback for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Phishing Detection Server running on http://localhost:${PORT}`);
});
