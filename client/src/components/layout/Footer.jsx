import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Rocket, 
  Bot, 
  ShieldCheck, 
  Clock, 
  Globe, 
  Activity, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  HeartHandshake
} from 'lucide-react';

export default function Footer() {
  const [istTime, setIstTime] = useState('');
  const [marketStatus, setMarketStatus] = useState('Open');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istString = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setIstTime(istString);

      // Check IST Market Status
      const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = istDate.getDay();
      const totalMins = istDate.getHours() * 60 + istDate.getMinutes();

      if (day === 0 || day === 6) {
        setMarketStatus('Closed (Weekend)');
      } else if (totalMins >= 540 && totalMins < 555) {
        setMarketStatus('Pre-Open (09:00 - 09:15)');
      } else if (totalMins >= 555 && totalMins < 930) {
        setMarketStatus('Live (09:15 - 15:30)');
      } else if (totalMins >= 930 && totalMins <= 960) {
        setMarketStatus('Post-Market (15:30 - 16:00)');
      } else {
        setMarketStatus('Closed (Opens 09:15 AM)');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLive = marketStatus.includes('Live') || marketStatus.includes('Pre-Open');

  return (
    <footer style={{
      backgroundColor: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      color: 'var(--text-secondary)',
      fontSize: '13px',
      marginTop: 'auto'
    }}>
      {/* Top Banner: Market Status & Exchange Ribbon */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--surface-secondary)',
        padding: '10px 24px'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isLive ? 'var(--positive)' : 'var(--text-muted)',
                boxShadow: isLive ? '0 0 8px var(--positive)' : 'none',
                display: 'inline-block'
              }} />
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                NSE / BSE Status:
              </span>
              <span style={{
                color: isLive ? 'var(--positive)' : 'var(--text-muted)',
                fontWeight: 600
              }}>
                {marketStatus}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <Clock size={13} />
              <span>Indian Standard Time (IST):</span>
              <span className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>
                {istTime || 'Loading...'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
            <span>Opening: <strong>09:15 AM IST</strong></span>
            <span>•</span>
            <span>Closing: <strong>03:30 PM IST</strong></span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} color="var(--primary)" />
              <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Live Feed Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info Grid */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '40px 24px 32px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '32px',
          marginBottom: '36px'
        }}>
          {/* Col 1: Brand & Overview */}
          <div style={{ minWidth: '240px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '15px'
              }}>
                SK
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                  Stock Knowledge
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Indian Equity & IPO Intelligence
                </div>
              </div>
            </Link>
            <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '16px' }}>
              High-frequency Indian equity analytics terminal providing real-time quotes, deep financial fundamentals, live IPO GMP tracking, and automated AI research.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}>
              <Globe size={13} color="var(--primary)" />
              <span>National Stock Exchange (NSE) & BSE</span>
            </div>
          </div>

          {/* Col 2: Markets & Indices */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '0.05em',
              marginBottom: '14px',
              textTransform: 'uppercase'
            }}>
              Markets & Movers
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <Link to="/market" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.15s ease' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <BarChart3 size={14} /> Market Overview & Indices
                </Link>
              </li>
              <li>
                <Link to="/market?tab=movers" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <TrendingUp size={14} /> Top Gainers & Losers
                </Link>
              </li>
              <li>
                <Link to="/market?tab=sectors" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <Layers size={14} /> Sector Performance Heatmap
                </Link>
              </li>
              <li>
                <Link to="/market?tab=breakouts" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <Sparkles size={14} /> 52-Week Breakout Radar
                </Link>
              </li>
              <li>
                <Link to="/stocks" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ChevronRight size={14} /> Nifty 500 Equity Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Research Tools & Intelligence */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '0.05em',
              marginBottom: '14px',
              textTransform: 'uppercase'
            }}>
              Research & Tools
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <Link to="/ipos" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <Rocket size={14} /> IPO Hub & Real-time GMP
                </Link>
              </li>
              <li>
                <Link to="/ai" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <Bot size={14} /> AI Valuation & Gemini Terminal
                </Link>
              </li>
              <li>
                <Link to="/news" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ChevronRight size={14} /> Live Corporate News Feed
                </Link>
              </li>
              <li>
                <Link to="/watchlist" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ChevronRight size={14} /> Custom Portfolio Watchlist
                </Link>
              </li>
              <li>
                <Link to="/settings" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ChevronRight size={14} /> Terminal Preferences
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Indian Market Trading Timings Schedule */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '0.05em',
              marginBottom: '14px',
              textTransform: 'uppercase'
            }}>
              NSE / BSE Trading Hours
            </div>
            <div style={{
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pre-Market:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>09:00 AM – 09:15 AM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Regular Cash Trading:</span>
                <span style={{ fontWeight: 600, color: 'var(--positive)' }}>09:15 AM – 03:30 PM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Post-Closing Session:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>03:30 PM – 04:00 PM</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Trading Days:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Monday – Friday</span>
              </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              *Excluding official NSE/BSE clearing holidays. All times in Indian Standard Time (UTC+5:30).
            </div>
          </div>
        </div>

        {/* Regulatory SEBI & Market Risk Disclaimer */}
        <div style={{
          backgroundColor: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          marginBottom: '24px'
        }}>
          <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '11px', lineHeight: 1.5, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Statutory Financial Disclaimer:</strong> Stock Knowledge is an independent research and educational analytics portal. We are not a SEBI-registered Investment Advisory (RIA) or Research Analyst (RA). Quotes, ratios, Gray Market Premiums (GMP), and automated AI valuations are provided for educational and analytical purposes only and should not be construed as investment advice or recommendations to buy or sell securities. Securities investments are subject to market volatility and risk. Please consult a qualified SEBI-registered financial advisor before making financial decisions.
          </div>
        </div>

        {/* Bottom Bar: Copyright & Terminal Details */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div>
            © {new Date().getFullYear()} Stock Knowledge Terminal. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span>NSE / BSE Real-time Feed</span>
            <span>•</span>
            <span>Gemini AI Engine</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
