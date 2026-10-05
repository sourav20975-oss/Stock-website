import React, { useState } from 'react';
import { Bot, Send, Sparkles, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

export default function AIResearchWidget({ initialSymbol = '', initialIpoSlug = '', standalone = false }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const suggestedPrompts = [
    initialSymbol ? `Explain ${initialSymbol} business model & key risks` : 'Explain TCS business model & valuation',
    initialIpoSlug ? `Analyze ${initialIpoSlug} IPO financials & risks` : 'Analyze Hyundai Motor India IPO valuation',
    'Compare TCS vs INFY fundamentals',
    'What does P/E ratio indicate in Indian market?'
  ];

  const handleSearch = async (textToSearch) => {
    const q = (textToSearch || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.chatAI(q, {
        symbol: initialSymbol,
        ipoSlug: initialIpoSlug
      });
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.message || 'Unable to retrieve research report.');
      }
    } catch (err) {
      setError(err.message || 'AI service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terminal-card" style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '10px',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            backgroundColor: 'var(--primary-subtle)',
            color: 'var(--primary)',
            padding: '5px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex'
          }}>
            <Bot size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              AI Research Terminal
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Fact-based analysis & regulatory filing synthesis
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--surface-secondary)',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <ShieldCheck size={12} color="var(--positive)" />
          <span>Factual / Non-Advisory</span>
        </div>
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={initialSymbol ? `Ask about ${initialSymbol} valuation, margins, or peers...` : "Ask about a stock, IPO or financial ratio..."}
          style={{
            flex: 1,
            backgroundColor: 'var(--surface-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            fontSize: '13px',
            color: 'var(--text)',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          {loading ? (
            <span>Researching...</span>
          ) : (
            <>
              <Send size={13} />
              <span>Analyze</span>
            </>
          )}
        </button>
      </form>

      {/* Prompt Suggestions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(p);
              handleSearch(p);
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background-color 0.1s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Sparkles size={11} color="var(--primary)" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          backgroundColor: 'var(--negative-bg)',
          border: '1px solid var(--negative-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          color: 'var(--negative)',
          fontSize: '12px',
          marginBottom: '12px'
        }}>
          {error}
        </div>
      )}

      {/* Research Output View */}
      {report && (
        <div style={{
          backgroundColor: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          fontSize: '13px',
          lineHeight: 1.6
        }}>
          {/* Target Title */}
          {report.targetName && (
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '8px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '6px'
            }}>
              {report.targetName}
            </div>
          )}

          {/* Structured Sections */}
          {report.summary && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                EXECUTIVE SUMMARY
              </div>
              <div style={{ color: 'var(--text)', marginTop: '2px' }}>
                {report.summary}
              </div>
            </div>
          )}

          {report.business && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                BUSINESS & OPERATIONS
              </div>
              <div style={{ color: 'var(--text)', marginTop: '2px' }}>
                {report.business}
              </div>
            </div>
          )}

          {report.financials && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                FINANCIAL POSITION & METRICS
              </div>
              <div style={{ color: 'var(--text)', whiteSpace: 'pre-line', marginTop: '2px' }}>
                {report.financials}
              </div>
            </div>
          )}

          {report.gmpContext && (
            <div style={{
              marginBottom: '10px',
              padding: '8px 10px',
              backgroundColor: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>
                GREY MARKET PREMIUM (GMP) OBSERVATION
              </div>
              <div style={{ color: 'var(--text)', fontSize: '12px', marginTop: '2px' }}>
                {report.gmpContext}
              </div>
            </div>
          )}

          {report.risks && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--negative)', textTransform: 'uppercase' }}>
                KEY RISK FACTORS
              </div>
              <div style={{ color: 'var(--text)', whiteSpace: 'pre-line', marginTop: '2px', fontSize: '12px' }}>
                {report.risks}
              </div>
            </div>
          )}

          {report.nextSteps && report.nextSteps.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                RECOMMENDED DUE DILIGENCE STEPS
              </div>
              <ul style={{ paddingLeft: '18px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {report.nextSteps.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sources Cited */}
          {report.sources && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px',
              borderTop: '1px solid var(--border)',
              paddingTop: '8px',
              marginTop: '10px',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              <span>Sources:</span>
              {report.sources.map((src, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1px 6px',
                    fontSize: '10px'
                  }}
                >
                  {src}
                </span>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div style={{
            marginTop: '8px',
            fontSize: '10px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <AlertTriangle size={11} color="var(--warning)" />
            <span>{report.disclaimer || 'Educational research only. Not SEBI registered investment advice.'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
