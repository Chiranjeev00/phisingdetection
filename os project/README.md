# Real-Time AI/ML-Based Phishing Detection and Prevention System (SIH25159)

A powerful, fast, and secure cybersecurity tool designed for the Smart India Hackathon. This project uses dynamic heuristic matching for URL and natural language analysis to detect phishing attempts without relying on static blocklists.

## Features

- **URL Scanner**: Detects anomalies like excessive dot counts, suspicious keywords, and domain tricks.
- **Email Scanner**: Checks NLP semantics for urgency cues and hidden unsecured links.
- **Real-Time Dashboard**: Charts and history of all detected targets using `Chart.js`.
- **Cybersecurity Theme**: Custom dark theme with neon accents built with pure HTML/CSS.
- **Local Storage**: Data persists in `db.json`.

## Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

### 2. Installation
Open a terminal in the root project folder and install the dependencies:
```bash
npm install
```

### 3. Run the Server
Start the Express API and frontend server:
```bash
npm start
```

### 4. Open in Browser
Visit the local server created at:
[http://localhost:3000](http://localhost:3000)

## Architecture

- **Frontend:** Vanilla HTML5, CSS3, JavaScript. Lightweight and instantly loads.
- **Backend:** Node.js, Express.js. Handles dynamic JSON payloads and heuristic modeling.
- **Storage:** Local `.json` database to keep track of scan history and counters across server reboots.

## Hackathon Demo Mode
All API responses have an intentional `1500-2000ms` delay to simulate heavy ML processing during the presentation, making the UI loading spinners clear and visible to judges.
this is new changes