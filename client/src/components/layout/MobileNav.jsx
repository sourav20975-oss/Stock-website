import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Rocket, Bot, Star } from 'lucide-react';

export default function MobileNav() {
  const itemStyle = ({ isActive }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    textDecoration: 'none',
    fontSize: '11px',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
    flex: 1
  });

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '56px',
      backgroundColor: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 60,
      padding: '0 8px'
    }} className="mobile-bottom-nav">
      <NavLink to="/" style={itemStyle} end>
        <LayoutDashboard size={18} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/market" style={itemStyle}>
        <BarChart3 size={18} />
        <span>Markets</span>
      </NavLink>
      <NavLink to="/ipos" style={itemStyle}>
        <Rocket size={18} />
        <span>IPOs</span>
      </NavLink>
      <NavLink to="/ai" style={itemStyle}>
        <Bot size={18} />
        <span>AI Terminal</span>
      </NavLink>
      <NavLink to="/watchlist" style={itemStyle}>
        <Star size={18} />
        <span>Watchlist</span>
      </NavLink>
    </nav>
  );
}
