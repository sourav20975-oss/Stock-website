import React, { useState, useEffect, useRef } from 'react';
import { Clock, Info, CheckCircle2, AlertCircle, ChevronDown, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MarketTimingBadge({ serverStatus }) {
  const [isOpen, setIsOpen] = useState(false);
  const [istTime, setIstTime] = useState('');
  const [sessionInfo, setSessionInfo] = useState({
    status: 'Open',
    label: 'Market Open',
    subText: 'Closes 3:30 PM',
    pillText: 'Open • 9:15 AM - 3:30 PM',
    color: 'var(--positive)',
    bgColor: 'var(--positive-bg)',
    borderColor: 'var(--positive-border)',
    dotColor: 'var(--positive)',
    detail: 'Normal cash & derivatives trading active',
    countdown: ''
  });

  const popoverRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Update IST clock and calculate session status dynamically every second
  useEffect(() => {
    const calculateSession = () => {
      const now = new Date();
      
      // Compute Asia/Kolkata date and time
      const istString = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setIstTime(istString);

      const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = istDate.getDay(); // 0 = Sun, 6 = Sat
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const totalMins = hours * 60 + minutes;

      const isWeekend = (day === 0 || day === 6);

      if (isWeekend) {
        setSessionInfo({
          status: 'Closed',
          label: 'Market Closed',
          subText: 'Opens Mon 9:15 AM',
          pillText: 'Closed • Opens Mon 9:15 AM',
          color: 'var(--text-muted)',
          bgColor: 'var(--surface-secondary)',
          borderColor: 'var(--border)',
          dotColor: 'var(--text-muted)',
          detail: 'Weekend holiday. Exchanges resume on Monday.',
          countdown: 'Opens Monday 09:15 AM IST'
        });
        return;
      }

      // Pre-market: 09:00 - 09:15 (540 to 555 min)
      if (totalMins >= 540 && totalMins < 555) {
        const minsToOpen = 555 - totalMins;
        setSessionInfo({
          status: 'Pre-Open',
          label: 'Pre-Open Session',
          subText: `Opens in ${minsToOpen}m`,
          pillText: `Pre-Open (9:00 - 9:15 AM)`,
          color: '#D97706',
          bgColor: 'var(--warning-bg)',
          borderColor: 'var(--warning-border)',
          dotColor: '#D97706',
          detail: 'Pre-market order placement & equilibrium price discovery.',
          countdown: `Regular trading begins in ${minsToOpen} minutes (09:15 AM)`
        });
        return;
      }

      // Regular Trading: 09:15 - 15:30 (555 to 930 min)
      if (totalMins >= 555 && totalMins < 930) {
        const minsLeft = 930 - totalMins;
        const h = Math.floor(minsLeft / 60);
        const m = minsLeft % 60;
        const remainingStr = h > 0 ? `${h}h ${m}m left` : `${m}m left`;

        setSessionInfo({
          status: 'Open',
          label: 'Market Open',
          subText: `Closes 3:30 PM (${remainingStr})`,
          pillText: `Open • 9:15 AM – 3:30 PM`,
          color: 'var(--positive)',
          bgColor: 'var(--positive-bg)',
          borderColor: 'var(--positive-border)',
          dotColor: 'var(--positive)',
          detail: 'Continuous live trading active across NSE & BSE.',
          countdown: `Market closes today at 03:30 PM IST (${remainingStr})`
        });
        return;
      }

      // Post-Market: 15:30 - 16:00 (930 to 960 min)
      if (totalMins >= 930 && totalMins <= 960) {
        setSessionInfo({
          status: 'Post-Market',
          label: 'Post-Closing Session',
          subText: 'Closes 4:00 PM',
          pillText: 'Post-Market • Closes 4:00 PM',
          color: '#0284C7',
          bgColor: 'var(--primary-subtle)',
          borderColor: 'var(--primary)',
          dotColor: '#0284C7',
          detail: 'Closing auction settlement and post-market trading.',
          countdown: 'Session concludes at 04:00 PM IST'
        });
        return;
      }

      // Normal Weekday Closed (before 09:00 or after 16:00)
      const opensToday = totalMins < 540;
      setSessionInfo({
        status: 'Closed',
        label: 'Market Closed',
        subText: opensToday ? 'Opens today 9:15 AM' : 'Opens tomorrow 9:15 AM',
        pillText: opensToday ? 'Closed • Opens 9:15 AM' : 'Closed • Opens tomorrow 9:15 AM',
        color: 'var(--text-muted)',
        bgColor: 'var(--surface-secondary)',
        borderColor: 'var(--border)',
        dotColor: 'var(--text-muted)',
        detail: 'Exchanges are currently closed for normal cash trading.',
        countdown: opensToday ? 'Opens today at 09:15 AM IST' : 'Next trading session opens tomorrow at 09:15 AM IST'
      });
    };

    calculateSession();
    const interval = setInterval(calculateSession, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLive = sessionInfo.status === 'Open';

  return (
    <div ref={popoverRef} style={{ position: 'relative' }}>
      {/* Interactive Navbar Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to view NSE / BSE market opening & closing timings"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 10px',
          backgroundColor: sessionInfo.bgColor,
          border: `1px solid ${sessionInfo.borderColor}`,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none'
        }}
      >
        {/* Pulsing indicator dot */}
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '8px', height: '8px' }}>
          {isLive && (
            <span style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: sessionInfo.dotColor,
              opacity: 0.4,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} />
          )}
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: sessionInfo.dotColor
          }} />
        </span>

        {/* Text Pill */}
        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: sessionInfo.color,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{sessionInfo.label}</span>
            <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: 500 }} className="hide-on-mobile">
              ({sessionInfo.subText})
            </span>
            <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
          </div>
        </div>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '320px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.18)',
          zIndex: 110,
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* Popover Header */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'var(--surface-secondary)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color="var(--primary)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                Indian Market Timings (NSE / BSE)
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: sessionInfo.bgColor,
              color: sessionInfo.color
            }}>
              {sessionInfo.status}
            </span>
          </div>

          {/* Body Content */}
          <div style={{ padding: '14px' }}>
            {/* Live Clock Strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-secondary)',
              marginBottom: '12px',
              fontSize: '12px'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current IST Time:</span>
              <strong className="num" style={{ color: 'var(--text)', fontSize: '13px' }}>
                {istTime || '--:--:-- --'}
              </strong>
            </div>

            {/* Timings Schedule Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginBottom: '14px' }}>
              {/* Pre-Market */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: sessionInfo.status === 'Pre-Open' ? 'var(--warning-bg)' : 'transparent',
                border: sessionInfo.status === 'Pre-Open' ? '1px solid var(--warning-border)' : '1px solid transparent'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>Pre-Market Session</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Order collection & discovery</div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>
                  09:00 AM – 09:15 AM
                </div>
              </div>

              {/* Regular Cash Trading */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: sessionInfo.status === 'Open' ? 'var(--positive-bg)' : 'transparent',
                border: sessionInfo.status === 'Open' ? '1px solid var(--positive-border)' : '1px solid transparent'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: isLive ? 'var(--positive)' : 'var(--text)' }}>
                    Regular Trading Session
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Continuous Equity & F&O</div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, color: isLive ? 'var(--positive)' : 'var(--text)' }}>
                  09:15 AM – 03:30 PM
                </div>
              </div>

              {/* Post-Market */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: sessionInfo.status === 'Post-Market' ? 'var(--primary-subtle)' : 'transparent',
                border: sessionInfo.status === 'Post-Market' ? '1px solid var(--primary)' : '1px solid transparent'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>Post-Closing Session</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Closing price computation</div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>
                  03:30 PM – 04:00 PM
                </div>
              </div>
            </div>

            {/* Current Status Message / Countdown */}
            <div style={{
              fontSize: '11px',
              padding: '8px 10px',
              backgroundColor: 'var(--surface-secondary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              marginBottom: '12px'
            }}>
              <strong style={{ color: 'var(--text)' }}>Status: </strong> 
              {sessionInfo.countdown || sessionInfo.detail}
            </div>

            {/* Link to Market Terminal */}
            <Link
              to="/market"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'opacity 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span>Go to Market Overview & Terminals</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
