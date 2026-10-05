import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useWatchlist } from '../context/WatchlistContext';

export default function Watchlist() {
  const { symbols, toggleWatchlist } = useWatchlist();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, [symbols]);

  // Connect live WebSocket updates for watched stocks
  useEffect(() => {
    symbols.forEach(sym => {
      const handleTick = (tick) => {
        setQuotes(prev => prev.map(q => {
          if (q.symbol === tick.symbol) {
            return {
              ...q,
              ltp: tick.ltp,
              change: tick.change,
              changePercent: tick.changePercent,
              volume: tick.volume,
              updatedAt: new Date(tick.timestamp).toISOString()
            };
          }
          return q;
        }));
      };

      socketService.subscribeStock(sym, handleTick);

      return () => {
        socketService.unsubscribeStock(sym, handleTick);
      };
    });
  }, [symbols]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const promises = symbols.map(sym => api.getStockQuote(sym).catch(() => null));
      const results = await Promise.all(promises);
      setQuotes(results.filter(r => r && r.success).map(r => r.data));
    } catch (err) {
      console.error('Error fetching watchlist quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          My Watchlist
        </h1>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Real-time tracking for your selected Indian equities with WebSocket live updates
        </div>
      </div>

      {loading && quotes.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your active watchlist...
        </div>
      ) : quotes.length === 0 ? (
        <div className="terminal-card" style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '480px', margin: '40px auto' }}>
          <Star size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
            No stocks in your watchlist
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Add stocks to track their live price, day ranges, and performance.
          </p>
          <Link to="/stocks" className="btn-primary" style={{ display: 'inline-flex' }}>
            <Search size={14} />
            <span>Search Stocks</span>
          </Link>
        </div>
      ) : (
        <div className="terminal-card">
          <table className="terminal-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}></th>
                <th>Symbol</th>
                <th>Company Name</th>
                <th>Exchange</th>
                <th className="num-col">Last Traded Price</th>
                <th className="num-col">Session Change</th>
                <th className="num-col">Change %</th>
                <th className="num-col">52-Week Range</th>
                <th>Last Update</th>
                <th style={{ width: '80px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(stock => {
                const isUp = stock.change >= 0;
                return (
                  <tr key={stock.symbol}>
                    <td style={{ textAlign: 'center' }}>
                      <Star size={14} color="#EAB308" fill="#EAB308" />
                    </td>
                    <td>
                      <Link to={`/stocks/${stock.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700 }}>
                        {stock.symbol}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {stock.name}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stock.exchange}</span>
                    </td>
                    <td className="num-col num" style={{ fontWeight: 700 }}>
                      ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="num-col num" style={{ fontWeight: 600, color: isUp ? 'var(--positive)' : 'var(--negative)' }}>
                      {isUp ? '+' : ''}{stock.change.toFixed(2)}
                    </td>
                    <td className="num-col num" style={{ fontWeight: 600, color: isUp ? 'var(--positive)' : 'var(--negative)' }}>
                      {isUp ? '+' : ''}{stock.changePercent}%
                    </td>
                    <td className="num-col num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ₹{stock.low52} - ₹{stock.high52}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(stock.updatedAt).toLocaleTimeString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => toggleWatchlist(stock.symbol)}
                        className="btn-secondary"
                        style={{ padding: '3px 6px', fontSize: '11px', color: 'var(--negative)' }}
                        title="Remove from watchlist"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
