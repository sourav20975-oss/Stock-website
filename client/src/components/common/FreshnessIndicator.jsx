import React, { useState, useEffect } from 'react';

export default function FreshnessIndicator({ timestamp, isLive = true, label = '' }) {
  const [timeAgo, setTimeAgo] = useState('just now');

  useEffect(() => {
    if (!timestamp) return;

    const updateAgo = () => {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const secs = Math.floor(diffMs / 1000);
      if (secs < 10) {
        setTimeAgo('just now');
      } else if (secs < 60) {
        setTimeAgo(`${secs}s ago`);
      } else if (secs < 3600) {
        setTimeAgo(`${Math.floor(secs / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(secs / 3600)}h ago`);
      }
    };

    updateAgo();
    const interval = setInterval(updateAgo, 5000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
      color: 'var(--text-muted)'
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: isLive ? 'var(--positive)' : 'var(--text-muted)',
        display: 'inline-block'
      }} />
      <span>{label || (isLive ? 'Live' : 'Cached')} • {timeAgo}</span>
    </div>
  );
}
