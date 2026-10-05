import React, { useState, useEffect, useCallback } from 'react';
import { Globe, ArrowUpRight, ArrowDownRight, RefreshCw, Zap } from 'lucide-react';
import { api } from '../../services/api';

export default function GlobalMarketsStrip() {
  const [globals, setGlobals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const fetchGlobalData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.getGlobalMarkets();
      if (res.success && res.data) {
        setGlobals(res.data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.warn('Global markets strip error:', e);
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  }, []);

  // 15 seconds Auto-Fetch Polling
  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(() => {
      fetchGlobalData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchGlobalData]);

  if (loading && globals.length === 0) return null;

  // Duplicate items for infinite seamless horizontal carousel loop
  const carouselItems = [...globals, ...globals];

  return (
    <>
      <style>{`
        @keyframes globalTapeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .global-tape-track {
          display: flex;
          align-items: center;
          gap: 28px;
          width: max-content;
          animation: globalTapeScroll 38s linear infinite;
        }
        .global-tape-track:hover {
          animation-play-state: paused;
        }
        .global-tape-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11.5px;
          white-space: nowrap;
          padding: 3px 6px;
          border-radius: 4px;
          transition: background-color 0.15s ease;
        }
        .global-tape-item:hover {
          background-color: var(--surface-secondary);
        }
      `}</style>

      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Left Control Bar: Badge + Live Indicator + Fetch Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          paddingRight: '12px',
          zIndex: 2,
          backgroundColor: 'var(--surface)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--primary)',
            letterSpacing: '0.04em'
          }}>
            <Globe size={13} />
            <span>GLOBAL TAPE:</span>
          </div>

          {/* 15s Auto-sync Pill */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: 'var(--positive-bg)',
            color: 'var(--positive)',
            border: '1px solid var(--positive-border)',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: 'var(--positive)',
              animation: 'pulse 1.8s infinite'
            }} />
            15s Auto
          </span>

          {/* Manual Fetch Button */}
          <button
            type="button"
            onClick={() => fetchGlobalData(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-secondary)',
              color: 'var(--text)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Fetch latest global exchange quotes now (Auto updates every 15s)"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Fetching...' : 'Fetch'}</span>
          </button>
        </div>

        {/* Center: Infinite Seamless Smooth Marquee Carousel */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          maskImage: 'linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent)'
        }}>
          <div className="global-tape-track">
            {carouselItems.map((item, idx) => {
              const isUp = item.isUp;
              return (
                <div key={`${item.symbol}-${idx}`} className="global-tape-item">
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                    {item.symbol}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }} className="num">
                    {item.currency === 'USD' ? '$' : '₹'}
                    {typeof item.ltp === 'number'
                      ? item.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : item.ltp}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '1px',
                    fontWeight: 700,
                    color: isUp ? '#089981' : '#f23645'
                  }} className="num">
                    {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    <span>{isUp ? '+' : ''}{item.changePercent}%</span>
                  </span>
                  <span style={{ color: 'var(--border)', margin: '0 4px' }}>•</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
