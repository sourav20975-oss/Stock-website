import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Search,
  Rocket,
  Newspaper,
  Star,
  Bot,
  Settings
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  // Strictly mutually exclusive active flags for Market items
  const isMarketOverviewActive = location.pathname === '/market' && (!location.search || !location.search.includes('tab=movers'));
  const isMoversActive = location.pathname === '/market' && location.search.includes('tab=movers');

  const getNavLinkClass = (isActive) => `sidebar-nav-link ${isActive ? 'active' : ''}`;

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      height: 'calc(100vh - var(--header-height))',
      position: 'sticky',
      top: 'var(--header-height)',
      overflowY: 'auto',
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <NavLink to="/" className={({ isActive }) => getNavLinkClass(isActive)} end>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        {/* Section: Markets */}
        <div style={{
          marginTop: '18px',
          marginBottom: '6px',
          paddingLeft: '12px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.05em'
        }}>
          MARKETS
        </div>
        <NavLink to="/market" className={() => getNavLinkClass(isMarketOverviewActive)}>
          <BarChart3 size={18} />
          <span>Market Overview</span>
        </NavLink>
        <NavLink to="/market?tab=movers" className={() => getNavLinkClass(isMoversActive)}>
          <TrendingUp size={18} />
          <span>Gainers & Losers</span>
        </NavLink>

        {/* Section: Research */}
        <div style={{
          marginTop: '18px',
          marginBottom: '6px',
          paddingLeft: '12px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.05em'
        }}>
          RESEARCH
        </div>
        <NavLink to="/stocks" className={({ isActive }) => getNavLinkClass(isActive)}>
          <Search size={18} />
          <span>Stock Directory</span>
        </NavLink>
        <NavLink to="/ipos" className={({ isActive }) => getNavLinkClass(isActive)}>
          <Rocket size={18} />
          <span>IPO Hub & GMP</span>
        </NavLink>
        <NavLink to="/news" className={({ isActive }) => getNavLinkClass(isActive)}>
          <Newspaper size={18} />
          <span>Market News</span>
        </NavLink>

        {/* Section: Personal */}
        <div style={{
          marginTop: '18px',
          marginBottom: '6px',
          paddingLeft: '12px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.05em'
        }}>
          PERSONAL
        </div>
        <NavLink to="/watchlist" className={({ isActive }) => getNavLinkClass(isActive)}>
          <Star size={18} />
          <span>My Watchlist</span>
        </NavLink>
        <NavLink to="/ai" className={({ isActive }) => getNavLinkClass(isActive)}>
          <Bot size={18} />
          <span>AI Research Terminal</span>
        </NavLink>
      </div>

      {/* System Settings */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <NavLink to="/settings" className={({ isActive }) => getNavLinkClass(isActive)}>
          <Settings size={18} />
          <span>Terminal Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
