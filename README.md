# 📈 Stock Knowledge Terminal

> **Next-Generation Indian Equity Research, Real-Time Market Terminals & Live IPO GMP Intelligence Platform**

[![Vite](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%2018-blue?logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-forestgreen?logo=mongodb)](https://www.mongodb.com/atlas)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Google%20Gemini%20API-orange?logo=google)](https://ai.google.dev/)
[![Market Data](https://img.shields.io/badge/Market%20Feeds-NSE%20%26%20BSE%20Live-red)](https://www.nseindia.com/)
[![License](https://img.shields.io/badge/License-MIT-purple)](#license)

---

## 🌟 Overview

**Stock Knowledge Terminal** is a full-stack, institutional-grade equity analytics SaaS platform tailored specifically for the Indian Stock Market (NSE & BSE). It provides real-time market data, technical benchmark terminals, live IPO Grey Market Premium (GMP) tracking, and automated balance sheet audit reports powered by **Google Gemini AI**.

Whether analyzing Nifty 50 constituents, discovering 52-week high breakout stocks, or estimating IPO listing day gains, Stock Knowledge provides retail traders and institutional analysts with seamless, real-time financial intelligence.

---

## ✨ Key Features

### 1. 📊 Real-Time Market Terminals & Indices
- **Live Benchmark Tickers**: Asynchronous streaming for **NIFTY 50**, **BANK NIFTY**, **SENSEX**, **NIFTY IT**, and **NIFTY MIDCAP 100**.
- **Market Breadth Command Bar**: Visual Advances vs Declines ratio meter with buyer/seller momentum.
- **Top Movers Dock**: Real-time gainers and losers sorted with high-liquidity stock monitoring, Day Range position meters, and volume statistics.
- **Sector Performance Heatmap**: Live sectoral tracker covering Auto, IT, Banking, Pharma, FMCG, Realty, and Oil & Gas.
- **52-Week Breakout Radar**: Real-time scanner identifying equities trading within 3–4% of their 52-week highs.

### 2. ⏰ Live Indian Market Opening & Closing Countdown
- **Dynamic Session Tracker**: Real-time clock in Indian Standard Time (IST) that detects exchange phases:
  - **Pre-Open Session**: `09:00 AM – 09:15 AM IST`
  - **Regular Cash & F&O Session**: `09:15 AM – 03:30 PM IST` (with live remaining time countdown)
  - **Post-Market Closing Session**: `03:30 PM – 04:00 PM IST`
  - **Weekend & Holiday Mode**: Automatic countdown to Monday 09:15 AM opening.
- **Interactive Navbar Popover**: Quick modal displaying official NSE/BSE operating hours and live IST clock.

### 3. 🚀 Primary Market & Live IPO GMP Hub
- **Grey Market Premium (GMP) Engine**: Live GMP tracking with automatic expected listing gain percentage computation.
- **Complete Issue Details**: Price bands, issue size, lot size, subscription dates, and retail quotas.
- **Allotment Status Checker**: Direct links and guidance for registrar allotment verification.

### 4. 🤖 AI Financial Research Desk & Peer Comparator
- **Gemini-Powered Stock Diagnoses**: Automated analysis of business models, revenue drivers, financial moats, and operational risks.
- **Peer Valuation Comparator**: Side-by-side benchmarking of key fundamental metrics:
  - P/E Ratio vs Sector Average
  - Return on Equity (ROE) & Return on Capital Employed (ROCE)
  - Debt-to-Equity & Price-to-Book (P/B)
  - Dividend Yield & Book Value Per Share

### 5. 🎨 Institutional Design System
- **Dark & Light Modes**: Bloomberg and Apple Finance inspired color palettes with zero jarring contrast.
- **Responsive Layout**: Designed for ultra-wide desktop monitors, laptops, tablets, and mobile devices.
- **Personal Watchlist**: Instant 1-click star to bookmark stocks across sessions.

---

## 🏗️ Architecture & Tech Stack

```text
Stock-Website/
├── client/                     # Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── components/         # Modular layout, market, and IPO UI widgets
│   │   │   ├── common/         # Freshness badges, indicators
│   │   │   ├── ipo/            # GMPBadge, subscription tables
│   │   │   ├── layout/         # Header, Footer, Sidebar, MarketTimingBadge
│   │   │   └── market/         # MarketIndices, StockChart
│   │   ├── context/            # ThemeContext (Light/Dark) & WatchlistContext
│   │   ├── pages/              # Dashboard, Market, Stocks, IPOs, AI, News
│   │   ├── services/           # REST API client & WebSocket listener
│   │   └── index.css           # Institutional design system & tokens
│   └── vite.config.js
│
├── server/                     # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/             # MongoDB Atlas connection
│   │   ├── data/               # Seed data for top liquid equities
│   │   ├── routes/             # REST API endpoints (stocks, IPOs, AI, market)
│   │   ├── services/           # Market data engine, IPO GMP scraper, Gemini AI
│   │   └── index.js            # Express server entry point & WebSocket setup
│   └── package.json
│
├── .env.example                # Safe environment variable template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Optional: MongoDB Atlas URI or local MongoDB instance (in-memory store available as fallback)
- Optional: Google Gemini API key for AI research desk

### 1. Clone the Repository
```bash
git clone https://github.com/sourav20975-oss/Stock-website.git
cd Stock-website
```

### 2. Install Dependencies
Install root, client, and server dependencies:
```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 3. Configure Environment Variables
Create a `.env` file in the `server` directory (or use `.env.example` as a template):

```bash
cp .env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/stock_knowledge?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Locally

#### Start Backend Server:
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

#### Start Frontend Client (in a separate terminal):
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

Alternatively, from the root folder:
```bash
npm run dev
```

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/market/status` | Current NSE/BSE session, IST clock, opening & closing timings |
| `GET` | `/api/market/indices` | Real-time live quotes for NIFTY 50, SENSEX, BANK NIFTY |
| `GET` | `/api/market/gainers` | Top NSE gainers with LTP, change %, and volume |
| `GET` | `/api/market/losers` | Top NSE losers with LTP and decline % |
| `GET` | `/api/market/overview` | Aggregated market dashboard payload |
| `GET` | `/api/stocks` | Searchable directory of Nifty equities |
| `GET` | `/api/stocks/:symbol` | Deep financial metrics, fundamentals & price history |
| `GET` | `/api/ipos` | Live IPO list with real-time Grey Market Premiums (GMP) |
| `POST` | `/api/ai/analyze` | Generate Gemini AI fundamental research report for a stock |
| `POST` | `/api/ai/compare` | Multi-stock fundamental comparison & strategy synthesis |

---

## ⚖️ Statutory Financial Disclaimer

> **Educational & Research Purposes Only**: Stock Knowledge is an independent technology and analytical research portal. It does not provide buy/sell recommendations or SEBI-registered portfolio management/investment advisory services. Stock market investments, derivatives trading, and IPO subscriptions are subject to market risks. Past performance is no guarantee of future returns. Please consult a SEBI-registered investment advisor before making financial decisions.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

**Crafted with ❤️ for Indian Equity Traders & Investors.**
