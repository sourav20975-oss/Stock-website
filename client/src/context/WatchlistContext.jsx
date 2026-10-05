import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
  const [symbols, setSymbols] = useState(['TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'TATAMOTORS']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const res = await api.getWatchlist();
      if (res.success && res.data?.symbols) {
        setSymbols(res.data.symbols);
      }
    } catch (err) {
      console.warn('Could not fetch watchlist from server, using local fallback:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const isWatched = (symbol) => {
    return symbols.includes(symbol?.toUpperCase());
  };

  const toggleWatchlist = async (symbol) => {
    const clean = symbol.toUpperCase();
    if (isWatched(clean)) {
      setSymbols(prev => prev.filter(s => s !== clean));
      try {
        await api.removeFromWatchlist(clean);
      } catch (err) {
        console.warn('Watchlist delete sync failed:', err.message);
      }
    } else {
      setSymbols(prev => [...prev, clean]);
      try {
        await api.addToWatchlist(clean);
      } catch (err) {
        console.warn('Watchlist add sync failed:', err.message);
      }
    }
  };

  return (
    <WatchlistContext.Provider value={{ symbols, isWatched, toggleWatchlist, fetchWatchlist, loading }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
