import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  GitCompare, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Zap, 
  Sliders, 
  HelpCircle,
  Award,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// Helper to format structured markdown AI reports
function FormattedReport({ rawText }) {
  if (!rawText) return null;

  const lines = rawText.split('\n');
  const sections = [];
  let currentTitle = 'Executive Overview';
  let currentItems = [];

  const flushSection = () => {
    if (currentItems.length > 0) {
      sections.push({ title: currentTitle, items: [...currentItems] });
      currentItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '---' || trimmed === '***') return;

    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    const boldHeaderMatch = !headerMatch && trimmed.match(/^\*\*([^*:]+)\*\*$/);

    if (headerMatch || (boldHeaderMatch && boldHeaderMatch[1].length < 40)) {
      flushSection();
      currentTitle = (headerMatch ? headerMatch[1] : boldHeaderMatch[1]).replace(/[*_]/g, '').trim();
      return;
    }

    currentItems.push(trimmed);
  });
  flushSection();

  const renderFormattedLine = (text) => {
    const clean = text.replace(/^[*\-•]+\s*/, '').replace(/^\d+\.\s*/, '');
    const parts = clean.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: 'var(--text)', fontWeight: 700, marginRight: '3px' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <span key={i} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={i} style={{ color: 'var(--text)' }}>{part}</span>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
      {sections.map((sec, secIdx) => {
        const isDisclaimer = sec.title.toLowerCase().includes('disclaimer');

        if (isDisclaimer) {
          return (
            <div key={secIdx} style={{
              backgroundColor: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '11.5px',
              color: 'var(--text)',
              lineHeight: 1.5,
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <AlertTriangle size={15} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--warning)', display: 'block', marginBottom: '2px' }}>
                  Regulatory Disclaimer & Due Diligence:
                </strong>
                {sec.items.map((item, idx) => (
                  <span key={idx} style={{ opacity: 0.9 }}>{item.replace(/[*_]/g, '')} </span>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={secIdx} style={{
            backgroundColor: 'var(--surface-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '8px 14px',
              backgroundColor: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--primary)',
              letterSpacing: '0.4px',
              textTransform: 'uppercase'
            }}>
              {sec.title}
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sec.items.map((item, idx) => {
                const isBullet = item.startsWith('*') || item.startsWith('-') || /^\d+\./.test(item);
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '12.5px',
                    lineHeight: 1.55,
                    color: 'var(--text)'
                  }}>
                    {isBullet ? (
                      <span style={{ color: 'var(--primary)', fontWeight: 800, flexShrink: 0 }}>▸</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px', flexShrink: 0 }}>•</span>
                    )}
                    <div style={{ flex: 1 }}>{renderFormattedLine(item)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AIResearchPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('COMPARE'); // 'COMPARE' or 'RESEARCH'

  // Comparator State
  const [sym1, setSym1] = useState('TCS');
  const [sym2, setSym2] = useState('INFY');
  const [compareReport, setCompareReport] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState(null);

  // Single AI Research State
  const [researchQuery, setResearchQuery] = useState('');
  const [researchReport, setResearchReport] = useState(null);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState(null);
  const [copied, setCopied] = useState(false);

  const samplePairs = [
    { s1: 'TCS', s2: 'INFY', label: 'TCS vs Infosys', tag: 'IT Leaders' },
    { s1: 'HDFCBANK', s2: 'ICICIBANK', label: 'HDFC Bank vs ICICI Bank', tag: 'Private Banking' },
    { s1: 'TATAMOTORS', s2: 'MARUTI', label: 'Tata Motors vs Maruti', tag: 'Auto OEMs' },
    { s1: 'RELIANCE', s2: 'BHARTIARTL', label: 'Reliance vs Bharti Airtel', tag: 'Telecom & Retail' },
    { s1: 'SUNPHARMA', s2: 'CIPLA', label: 'Sun Pharma vs Cipla', tag: 'Pharma Leaders' }
  ];

  const suggestedPrompts = [
    'Explain TCS business model, order book TCV & moat',
    'Analyze Hyundai Motor India IPO valuation & risks',
    'How do rising US bond yields impact Indian IT stocks?',
    'Explain P/E ratio and ROE safety criteria for investors'
  ];

  // Auto-run initial comparison on mount
  useEffect(() => {
    executeComparison('TCS', 'INFY');
  }, []);

  const executeComparison = async (s1, s2) => {
    const symbol1 = (s1 || sym1).trim().toUpperCase();
    const symbol2 = (s2 || sym2).trim().toUpperCase();

    if (!symbol1 || !symbol2) return;

    setComparing(true);
    setCompareError(null);

    try {
      const res = await api.compareStocks(symbol1, symbol2);
      if (res.success && res.data) {
        setCompareReport(res.data);
      } else {
        setCompareError(res.message || 'Could not complete comparison.');
      }
    } catch (err) {
      console.error('Compare error:', err);
      setCompareError(err.message || 'Failed to compare stocks. Check symbol validity.');
    } finally {
      setComparing(false);
    }
  };

  const executeResearch = async (q) => {
    const query = (q || researchQuery).trim();
    if (!query) return;

    setResearching(true);
    setResearchError(null);

    try {
      const res = await api.chatAI(query);
      if (res.success && res.data) {
        setResearchReport(res.data);
      } else {
        setResearchError(res.message || 'Could not generate research report.');
      }
    } catch (err) {
      console.error('Research error:', err);
      setResearchError(err.message || 'AI service error. Please try again.');
    } finally {
      setResearching(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cData = compareReport?.comparisonData;
  const s1 = cData?.stock1;
  const s2 = cData?.stock2;

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', paddingBottom: '50px' }}>
      
      {/* 1. TERMINAL HEADER */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Bot size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>
              AI Research & Peer Valuation Terminal
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Institutional comparative valuation multiples, competitive moat analysis & regulatory filings distillation
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '3px'
        }}>
          <button
            onClick={() => setActiveTab('COMPARE')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'COMPARE' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'COMPARE' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <GitCompare size={14} />
            <span>Peer Valuation Arena</span>
          </button>

          <button
            onClick={() => setActiveTab('RESEARCH')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'RESEARCH' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'RESEARCH' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={14} />
            <span>Deep Equity & IPO Synthesis</span>
          </button>
        </div>
      </div>

      {/* 2. MODE 1: PEER VALUATION ARENA */}
      {activeTab === 'COMPARE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Symbol Comparison Selector Bar */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '18px 22px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeComparison(sym1, sym2);
              }}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 380px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    BENCHMARK COMPANY 1
                  </label>
                  <input
                    type="text"
                    value={sym1}
                    onChange={(e) => setSym1(e.target.value.toUpperCase())}
                    placeholder="e.g. TCS"
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      fontWeight: 800,
                      color: 'var(--text)',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>

                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 800,
                  marginTop: '16px'
                }}>
                  VS
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    PEER COMPANY 2
                  </label>
                  <input
                    type="text"
                    value={sym2}
                    onChange={(e) => setSym2(e.target.value.toUpperCase())}
                    placeholder="e.g. INFY"
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      fontWeight: 800,
                      color: 'var(--text)',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={comparing || !sym1 || !sym2}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px 24px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: comparing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                  marginTop: '16px'
                }}
              >
                <GitCompare size={15} className={comparing ? 'animate-spin' : ''} />
                <span>{comparing ? 'Synthesizing Multiples...' : 'Compare Fundamental Multiples'}</span>
              </button>
            </form>

            {/* Quick Pairs */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px',
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>
                Suggested Peer Matchups:
              </span>
              {samplePairs.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSym1(p.s1);
                    setSym2(p.s2);
                    executeComparison(p.s1, p.s2);
                  }}
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--primary)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{p.label}</span>
                  <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>({p.tag})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Error */}
          {compareError && (
            <div style={{
              backgroundColor: 'var(--negative-bg)',
              border: '1px solid var(--negative-border)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--negative)',
              fontSize: '12px'
            }}>
              {compareError}
            </div>
          )}

          {/* DUAL COMPARATIVE SHOWCASE */}
          {comparing ? (
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <RefreshCw size={26} className="animate-spin" />
              <div style={{ fontSize: '14px', fontWeight: 700 }}>
                Synthesizing multi-year valuation multiples & regulatory data for {sym1} vs {sym2}...
              </div>
            </div>
          ) : cData && s1 && s2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Dual Company Profile Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {/* Stock 1 Card */}
                <div style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '18px',
                  boxShadow: 'var(--card-shadow)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>{s1.symbol}</span>
                        <span style={{
                          backgroundColor: 'var(--primary-subtle)',
                          color: 'var(--primary)',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {s1.exchange}:EQ
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {s1.name} • <span style={{ color: 'var(--text-muted)' }}>{s1.sector}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                        ₹{s1.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: s1.change >= 0 ? 'var(--positive)' : 'var(--negative)'
                      }}>
                        {s1.change >= 0 ? '+' : ''}{s1.change?.toFixed(2)} ({s1.changePercent}%)
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Market Cap: <b style={{ color: 'var(--text)' }}>{s1.marketCap}</b></span>
                    <Link to={`/stocks/${s1.symbol}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>Open Terminal</span>
                      <ArrowUpRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* Stock 2 Card */}
                <div style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '18px',
                  boxShadow: 'var(--card-shadow)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>{s2.symbol}</span>
                        <span style={{
                          backgroundColor: 'var(--primary-subtle)',
                          color: 'var(--primary)',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {s2.exchange}:EQ
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {s2.name} • <span style={{ color: 'var(--text-muted)' }}>{s2.sector}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                        ₹{s2.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: s2.change >= 0 ? 'var(--positive)' : 'var(--negative)'
                      }}>
                        {s2.change >= 0 ? '+' : ''}{s2.change?.toFixed(2)} ({s2.changePercent}%)
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Market Cap: <b style={{ color: 'var(--text)' }}>{s2.marketCap}</b></span>
                    <Link to={`/stocks/${s2.symbol}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>Open Terminal</span>
                      <ArrowUpRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Head-to-Head Multiples Matrix */}
              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'var(--text)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Award size={16} color="var(--primary)" />
                  <span>HEAD-TO-HEAD VALUATION MULTIPLES BENCHMARK</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px 14px', width: '30%' }}>METRIC / RATIO</th>
                        <th style={{ padding: '10px 14px', width: '35%', textAlign: 'center', color: 'var(--text)' }}>{s1.symbol}</th>
                        <th style={{ padding: '10px 14px', width: '35%', textAlign: 'center', color: 'var(--text)' }}>{s2.symbol}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* P/E Ratio */}
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>
                          P/E Ratio
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Lower multiple = Cheaper valuation</span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '14px',
                            color: s1.pe <= s2.pe ? 'var(--positive)' : 'var(--text)',
                            backgroundColor: s1.pe <= s2.pe ? 'var(--positive-bg)' : 'transparent',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}>
                            {s1.pe}x {s1.pe <= s2.pe ? '★ Cheaper' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '14px',
                            color: s2.pe < s1.pe ? 'var(--positive)' : 'var(--text)',
                            backgroundColor: s2.pe < s1.pe ? 'var(--positive-bg)' : 'transparent',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}>
                            {s2.pe}x {s2.pe < s1.pe ? '★ Cheaper' : ''}
                          </span>
                        </td>
                      </tr>

                      {/* ROE */}
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>
                          Return on Equity (ROE)
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Higher percentage = Better capital efficiency</span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '14px',
                            color: s1.roe >= s2.roe ? 'var(--positive)' : 'var(--text)',
                            backgroundColor: s1.roe >= s2.roe ? 'var(--positive-bg)' : 'transparent',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}>
                            {s1.roe}% {s1.roe >= s2.roe ? '★ Superior' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '14px',
                            color: s2.roe > s1.roe ? 'var(--positive)' : 'var(--text)',
                            backgroundColor: s2.roe > s1.roe ? 'var(--positive-bg)' : 'transparent',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}>
                            {s2.roe}% {s2.roe > s1.roe ? '★ Superior' : ''}
                          </span>
                        </td>
                      </tr>

                      {/* ROCE */}
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>
                          ROCE
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Return on Capital Employed</span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                          {s1.roce}%
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                          {s2.roce}%
                        </td>
                      </tr>

                      {/* Dividend Yield */}
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>
                          Dividend Yield
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Annual payout yield</span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                          {s1.dividendYield}%
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                          {s2.dividendYield}%
                        </td>
                      </tr>

                      {/* Debt / Equity */}
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>
                          Debt to Equity
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Lower = Healthier balance sheet leverage</span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                          {s1.debtToEquity}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                          {s2.debtToEquity}
                        </td>
                      </tr>

                      {/* Book Value */}
                      <tr>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>
                          Book Value (Per Share)
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                          ₹{s1.bookValue}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                          ₹{s2.bookValue}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Comparative Synthesis Report */}
              {(compareReport.summary || compareReport.content) && (
                <div style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bot size={18} color="var(--primary)" />
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                        AI COMPARATIVE STRATEGY REPORT: {s1.symbol} vs {s2.symbol}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(compareReport.summary || compareReport.content)}
                      style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copied ? <Check size={12} color="var(--positive)" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy Report'}</span>
                    </button>
                  </div>

                  <FormattedReport rawText={compareReport.summary || compareReport.content} />
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 3. MODE 2: DEEP EQUITY & IPO SYNTHESIS */}
      {activeTab === 'RESEARCH' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Query Bar */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeResearch();
              }}
              style={{ display: 'flex', gap: '10px' }}
            >
              <input
                type="text"
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                placeholder="Ask about ANY Indian equity, IPO valuation, moat, or financial multiple..."
                style={{
                  flex: 1,
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: 'var(--text)'
                }}
              />
              <button
                type="submit"
                disabled={researching || !researchQuery.trim()}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: researching ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                <Sparkles size={14} className={researching ? 'animate-spin' : ''} />
                <span>{researching ? 'Synthesizing...' : 'Synthesize Research'}</span>
              </button>
            </form>

            {/* Quick Prompts */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setResearchQuery(p);
                    executeResearch(p);
                  }}
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--primary)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  + {p}
                </button>
              ))}
            </div>
          </div>

          {/* Research Error */}
          {researchError && (
            <div style={{
              backgroundColor: 'var(--negative-bg)',
              border: '1px solid var(--negative-border)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--negative)',
              fontSize: '12px'
            }}>
              {researchError}
            </div>
          )}

          {/* Research Report Viewer */}
          {researching ? (
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <RefreshCw size={26} className="animate-spin" />
              <div style={{ fontSize: '14px', fontWeight: 700 }}>
                Synthesizing regulatory filings & valuation metrics...
              </div>
            </div>
          ) : researchReport ? (
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px 24px',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={18} color="var(--primary)" />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                    SYNTHESIS REPORT: {researchReport.targetName || 'Indian Financial Analysis'}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(researchReport.summary || researchReport.content)}
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copied ? <Check size={12} color="var(--positive)" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy Report'}</span>
                </button>
              </div>

              <FormattedReport rawText={researchReport.summary || researchReport.content} />
            </div>
          ) : null}
        </div>
      )}

      {/* 4. COMPLIANCE & SAFETY STRIP */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '14px 18px',
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '11.5px',
        color: 'var(--text-secondary)',
        boxShadow: 'var(--card-shadow)'
      }}>
        <ShieldCheck size={16} color="var(--positive)" style={{ flexShrink: 0 }} />
        <span>
          <b>Factual Research Directive:</b> The Stock Knowledge AI engine operates under strict non-advisory safety guardrails. Multiples and fundamental metrics are pulled live from verifiable exchange data and regulatory filings.
        </span>
      </div>
    </div>
  );
}
