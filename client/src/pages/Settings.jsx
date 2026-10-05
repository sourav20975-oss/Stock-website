import React from 'react';
import { Sun, Moon, Database, Shield, Zap, Server } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Terminal Settings & System Health
        </h1>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Configure design system themes, data refresh guardrails, and market data provider interfaces
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Theme Settings */}
        <div className="terminal-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                Visual Appearance
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Toggle between tailored high-contrast dark and paper-light finance palettes
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
            </button>
          </div>
        </div>

        {/* Rate Limiting & Cooldown Guardrails */}
        <div className="terminal-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Zap size={16} color="var(--primary)" />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              Refresh Rate Limit & Anti-Abuse Cooldown
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
            To protect server bandwidth and avoid hitting external Angel One and market feeds limits, on-demand quote refreshes are gated by a mandatory <strong>15-second server-side cooldown</strong> per client IP address.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--surface-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Enforced Cooldown:</span>
            <strong className="num">15 seconds</strong>
          </div>
        </div>

        {/* Market Data & Gateway Providers */}
        <div className="terminal-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Server size={16} color="var(--positive)" />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              Market Data & AI Gateways
            </div>
          </div>
          <table className="terminal-table" style={{ marginTop: '8px' }}>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Protocol</th>
                <th>Status</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Angel One SmartAPI Gateway</td>
                <td>REST & WebSocket</td>
                <td><span style={{ color: 'var(--positive)', fontWeight: 600 }}>● Active</span></td>
                <td>Low-overhead cached / manual refresh</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>IPO & GMP Surveillance</td>
                <td>Merchant & DRHP Feed</td>
                <td><span style={{ color: 'var(--positive)', fontWeight: 600 }}>● Active</span></td>
                <td>Restated Audited Prospectus Engine</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>NSE MCP / Research Agent</td>
                <td>OpenRouter / Local Heuristic</td>
                <td><span style={{ color: 'var(--positive)', fontWeight: 600 }}>● Active</span></td>
                <td>Tool Calling & Regulatory Synthesis</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
