import React, { useState, useEffect, useCallback } from 'react';
import { Layers, ArrowUpRight, ArrowDownRight, RefreshCw, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function SectorsRibbonStrip() {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSectorData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.getSectoralRibbon();
      if (res.success && res.data) {
        setSectors(res.data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.warn('Sectoral strip fetch error:', e);
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  }, []);

  // 15 seconds Auto-Fetch Polling
  useEffect(() => {
    fetchSectorData();
    const interval = setInterval(() => {
      fetchSectorData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchSectorData]);

  if (loading && sectors.length === 0) return null;

  // Duplicate for seamless infinite carousel loop
  const carouselItems = [...sectors, ...sectors];

  return (
    <>
      <style>{`
        @keyframes sectorTapeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .sector-tape-track {
          display: flex;
          align-items: center;
          gap: 20px;
          width: max-content;
          animation: sectorTapeScroll 34s linear infinite;
        }
        .sector-tape-track:hover {
          animation-play-state: paused;
        }
        .sector-tape-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          white-space: nowrap;
          padding: 4px 10px;
          border-radius: 6px;
          background-color: var(--surface-secondary);
          border: 1px solid var(--border);
          text-decoration: none;
          color: var(--text);
          transition: all 0.15s ease;
        }
        .sector-tape-item:hover {
          border-color: var(--primary);
          background-color: var(--surface);
          transform: translateY(-1px);
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
            color: 'var(--text)',
            letterSpacing: '0.04em'
          }}>
            <Layers size={13} color="var(--primary)" />
            <span>SECTORS:</span>
          </div>

          {/* 15s Auto-sync Pill */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '9.5px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: 'rgba(8, 153, 129, 0.1)',
            color: 'var(--positive)',
            border: '1px solid rgba(8, 153, 129, 0.25)'
          }}>
            <span style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: 'var(--positive)',
              animation: 'pulse 1.8s infinite'
            }} />
            15s Live
          </span>

          {/* Manual Fetch Button */}
          <button
            onClick={() => fetchSectorData(true)}
            disabled={refreshing}
            title="Fetch real live sector prices now"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: refreshing ? 'var(--surface-secondary)' : 'var(--primary-subtle)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: refreshing ? 'wait' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Fetching...' : 'Fetch'}</span>
          </button>
        </div>

        {/* Scrolling Carousel Track */}
        <div style={{
          overflow: 'hidden',
          width: '100%',
          maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)'
        }}>
          <div className="sector-tape-track">
            {carouselItems.map((sec, idx) => (
              <Link
                key={`${sec.name}-${idx}`}
                to="/market?tab=sectors"
                className="sector-tape-item"
              >
                <span style={{ fontWeight: 700, fontSize: '11px' }}>
                  {sec.name}
                </span>
                {sec.ltp && (
                  <span className="num" style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px' }}>
                    ₹{sec.ltp.toLocaleString('en-IN')}
                  </span>
                )}
                <span
                  className="num"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontWeight: 700,
                    color: sec.isUp ? 'var(--positive)' : 'var(--negative)',
                    backgroundColor: sec.isUp ? 'rgba(8, 153, 129, 0.08)' : 'rgba(242, 54, 69, 0.08)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontSize: '10.5px'
                  }}
                >
                  {sec.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {sec.changeFormatted || `${sec.isUp ? '+' : ''}${sec.changePercent}%`}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Timestamp / Hover hint */}
        {lastUpdated && (
          <div style={{
            fontSize: '9.5px',
            color: 'var(--text-muted)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderLeft: '1px solid var(--border)',
            paddingLeft: '10px',
            zIndex: 2,
            backgroundColor: 'var(--surface)'
          }}>
            <Zap size={10} color="var(--positive)" />
            <span>{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        )}
      </div>
    </>
  );
}
