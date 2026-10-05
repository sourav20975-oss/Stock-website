import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { WatchlistProvider } from './context/WatchlistContext';
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import StockDetails from './pages/StockDetails';
import IPOList from './pages/IPOList';
import IPODetails from './pages/IPODetails';
import Market from './pages/Market';
import Watchlist from './pages/Watchlist';
import NewsPage from './pages/NewsPage';
import AIResearchPage from './pages/AIResearchPage';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <WatchlistProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/stocks/:symbol" element={<StockDetails />} />
              <Route path="/ipos" element={<IPOList />} />
              <Route path="/ipos/:slug" element={<IPODetails />} />
              <Route path="/market" element={<Market />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/ai" element={<AIResearchPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </WatchlistProvider>
    </ThemeProvider>
  );
}
