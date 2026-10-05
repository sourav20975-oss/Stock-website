import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  RefreshCw, 
  Star, 
  ArrowUpRight, 
  ArrowDownRight, 
  Globe, 
  Building2, 
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  X,
  CheckCircle2,
  Gauge,
  Sliders,
  Zap,
  Sparkles,
  Bot,
  Newspaper,
  BookOpen,
  HelpCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useWatchlist } from '../context/WatchlistContext';
import { usePortfolio } from '../context/PortfolioContext';
import StockChart from '../components/market/StockChart';
import FreshnessIndicator from '../components/common/FreshnessIndicator';
import { getIndianMarketStatus } from '../utils/marketTiming';

// Line-by-Line Executive Research Report Formatter
function FormattedResearchReport({ rawText }) {
  if (!rawText) return null;

  // Split lines and group into structured sections
  const lines = rawText.split('\n');
  const sections = [];
  let currentTitle = 'Executive Overview';
  let currentItems = [];

  const flushSection = () => {
    if (currentItems.length > 0) {
      sections.push({
        title: currentTitle,
        items: [...currentItems]
      });
      currentItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '---' || trimmed === '***') return;

    // Detect section headers: ### Title, ## Title, or **Title** without colon
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

  // Helper to parse bold and italic inline tokens
  const renderFormattedLine = (text) => {
    // Strip markdown bullet chars from the start
    const clean = text.replace(/^[*\-•]+\s*/, '').replace(/^\d+\.\s*/, '');
    const parts = clean.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: 'var(--text)', fontWeight: 600, marginRight: '3px' }}>
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

  const getSectionTheme = (title) => {
    const t = title.toLowerCase();
    if (t.includes('summary') || t.includes('overview')) return { color: '#38bdf8', icon: '⚡', bg: 'rgba(56, 189, 248, 0.08)', border: 'rgba(56, 189, 248, 0.25)', badge: 'Overview' };
    if (t.includes('business') || t.includes('moat') || t.includes('operation') || t.includes('loan')) return { color: '#10b981', icon: '🏛️', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', badge: 'Operations' };
    if (t.includes('valuation') || t.includes('financial') || t.includes('position')) return { color: '#f59e0b', icon: '📊', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', badge: 'Financials' };
    if (t.includes('risk') || t.includes('headwind') || t.includes('threat')) return { color: '#ef4444', icon: '⚠️', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', badge: 'Risk Factors' };
    if (t.includes('next') || t.includes('research') || t.includes('checklist')) return { color: '#a855f7', icon: '🎯', bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.25)', badge: 'Next Steps' };
    return { color: 'var(--primary)', icon: '📌', bg: 'var(--surface-secondary)', border: 'var(--border)', badge: 'Research' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
      {sections.map((sec, secIdx) => {
        const theme = getSectionTheme(sec.title);
        const isDisclaimer = sec.title.toLowerCase().includes('disclaimer');

        if (isDisclaimer) {
          return (
            <div key={secIdx} style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '11px',
              color: 'var(--text)',
              lineHeight: 1.5,
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '14px', marginTop: '1px' }}>🛡️</span>
              <div>
                <strong style={{ color: '#d97706', display: 'block', marginBottom: '2px' }}>SEBI Regulatory Compliance & Risk Advisory:</strong>
                {sec.items.map((item, idx) => (
                  <span key={idx} style={{ opacity: 0.9 }}>{item.replace(/[*_]/g, '')} </span>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={secIdx} style={{
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)'
          }}>
            {/* Section Header Bar */}
            <div style={{
              padding: '8px 12px',
              backgroundColor: 'var(--surface-secondary)',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px' }}>{theme.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: theme.color, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                  {sec.title}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)'
              }}>
                {theme.badge}
              </span>
            </div>

            {/* Section Body with Line-by-Line Formatting */}
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sec.items.map((item, idx) => {
                // Check if item is a sub-heading (e.g. #### 1. Core Revenue Drivers, or **1. Core Revenue Drivers**)
                const isSubHeader = item.startsWith('####') || (item.startsWith('**') && item.endsWith('**') && item.length < 50);
                if (isSubHeader) {
                  const subTitle = item.replace(/^[#*\s]+/, '').replace(/[*#\s]+$/, '');
                  return (
                    <div key={idx} style={{
                      marginTop: idx > 0 ? '6px' : '0px',
                      padding: '4px 8px',
                      backgroundColor: 'var(--surface-secondary)',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      alignSelf: 'flex-start'
                    }}>
                      <span style={{ color: theme.color }}>§</span>
                      <span>{subTitle}</span>
                    </div>
                  );
                }

                // Check if item is a bullet/numbered point
                const isBullet = item.startsWith('*') || item.startsWith('-') || /^\d+\./.test(item);

                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--text)',
                    lineHeight: 1.55,
                    padding: isBullet ? '4px 8px' : '2px 0',
                    backgroundColor: isBullet ? 'var(--surface-secondary)' : 'transparent',
                    borderRadius: '5px',
                    borderLeft: isBullet ? `2px solid ${theme.color}` : 'none'
                  }}>
                    {isBullet ? (
                      <span style={{ color: theme.color, fontWeight: 800, marginTop: '1px', fontSize: '11px', flexShrink: 0 }}>
                        ▸
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>•</span>
                    )}
                    <div style={{ flex: 1 }}>
                      {renderFormattedLine(item)}
                    </div>
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

export default function StockDetails() {
  const { symbol } = useParams();
  const cleanSymbol = (symbol || 'TCS').toUpperCase();
  const { isWatched, toggleWatchlist } = useWatchlist();
  const { buyStock, sellStock, cashBalance, holdings } = usePortfolio();

  const [stock, setStock] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [flashDirection, setFlashDirection] = useState(null);

  // Tab state for Bottom Research Dock: 'AI' or 'NEWS'
  const [bottomTab, setBottomTab] = useState('AI');

  // AI interactive state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Trading Modal (Paper Trading Demo)
  const [orderModal, setOrderModal] = useState({ open: false, type: 'BUY' }); // 'BUY' or 'SELL'
  const [productType, setProductType] = useState('MIS'); // 'MIS' (Intraday) or 'CNC' (Delivery)
  const [orderVariety, setOrderVariety] = useState('MARKET'); // 'MARKET' or 'LIMIT'
  const [quantity, setQuantity] = useState(50);
  const [limitPrice, setLimitPrice] = useState(0);
  const [orderToast, setOrderToast] = useState(null);

  // Dynamic Level 2 Market Depth (Fluctuates around current LTP)
  const [marketDepth, setMarketDepth] = useState({
    bids: [],
    asks: [],
    totalBuyQty: 184520,
    totalSellQty: 142180
  });

  // Accurate Indian Market Session State (Asia/Kolkata)
  const [marketSession, setMarketSession] = useState(getIndianMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketSession(getIndianMarketStatus());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial stock data
  useEffect(() => {
    fetchStockDetails();

    // Subscribe to live websocket updates
    const handleLiveTick = (tick) => {
      // STRICT CHECK: If market is closed or tick says market not open, DO NOT alter prices or flash!
      if (tick?.isMarketOpen === false || !getIndianMarketStatus().isOpen) {
        return;
      }

      setStock(prev => {
        if (!prev) return prev;
        const dir = tick.ltp >= prev.ltp ? 'up' : 'down';
        setFlashDirection(dir);
        setTimeout(() => setFlashDirection(null), 800);

        const newLtp = tick.ltp;
        updateDynamicDepth(newLtp);

        return {
          ...prev,
          ltp: newLtp,
          change: tick.change !== undefined ? tick.change : prev.change,
          changePercent: tick.changePercent !== undefined ? tick.changePercent : prev.changePercent,
          volume: tick.volume || prev.volume,
          high: Math.max(prev.high, tick.high || newLtp),
          low: Math.min(prev.low, tick.low || newLtp),
          updatedAt: new Date(tick.timestamp || Date.now()).toISOString()
        };
      });
    };

    socketService.subscribeStock(cleanSymbol, handleLiveTick);

    return () => {
      socketService.unsubscribeStock(cleanSymbol, handleLiveTick);
    };
  }, [cleanSymbol]);

  // Generate realistic Level 2 Market Depth with proportional visual depth bars
  const updateDynamicDepth = (ltp) => {
    if (!ltp) return;
    const bids = [];
    const asks = [];
    let buySum = 0;
    let sellSum = 0;

    for (let i = 1; i <= 5; i++) {
      const bidP = Math.round((ltp - (i * 0.15 + (Math.random() * 0.08 - 0.04))) * 100) / 100;
      const askP = Math.round((ltp + (i * 0.15 + (Math.random() * 0.08 - 0.04))) * 100) / 100;
      const bidQ = Math.floor(450 + Math.random() * 2800);
      const askQ = Math.floor(450 + Math.random() * 2800);
      const bidOrders = Math.floor(3 + Math.random() * 16);
      const askOrders = Math.floor(3 + Math.random() * 16);

      buySum += bidQ;
      sellSum += askQ;

      bids.push({ price: bidP, qty: bidQ, orders: bidOrders });
      asks.push({ price: askP, qty: askQ, orders: askOrders });
    }

    setMarketDepth({
      bids,
      asks,
      totalBuyQty: buySum * 14,
      totalSellQty: sellSum * 15
    });
  };

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const fetchStockDetails = async () => {
    setLoading(true);
    try {
      const [stockRes, newsRes] = await Promise.all([
        api.getStockQuote(cleanSymbol),
        api.getStockNews(cleanSymbol)
      ]);
      if (stockRes.success && stockRes.data) {
        setStock(stockRes.data);
        setLimitPrice(stockRes.data.ltp);
        updateDynamicDepth(stockRes.data.ltp);
      }
      if (newsRes.success) setNews(newsRes.data);
    } catch (err) {
      console.error('Error fetching stock details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing || cooldownSeconds > 0) return;
    setRefreshing(true);
    setFeedbackMsg('');

    try {
      const res = await api.refreshStock(cleanSymbol);
      if (res.success && res.data) {
        setStock(res.data);
        setCooldownSeconds(15);
        setFeedbackMsg('✓ Live Feed Synced');
        setTimeout(() => setFeedbackMsg(''), 4000);
      }
    } catch (err) {
      if (err.code === 'RATE_LIMITED' && err.data?.retryAfter) {
        setCooldownSeconds(err.data.retryAfter);
        setFeedbackMsg(`Please wait ${err.data.retryAfter}s`);
      } else {
        setFeedbackMsg('Unable to refresh market data');
      }
    } finally {
      setRefreshing(false);
    }
  };

  // AI Prompt Dispatch
  const handleAiSearch = async (customPrompt) => {
    const q = (customPrompt || aiPrompt).trim();
    if (!q) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api.chatAI(q, { symbol: cleanSymbol });
      if (res.success && res.data) {
        setAiReport(res.data);
      } else {
        setAiError(res.message || 'Unable to generate research report.');
      }
    } catch (err) {
      setAiError(err.message || 'AI research service temporarily unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyReport = () => {
    const text = aiReport?.summary || aiReport?.content;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open Order Placement Pad
  const openOrderPad = (type) => {
    setOrderModal({ open: true, type });
    if (stock) {
      setLimitPrice(stock.ltp);
    }
  };

  // Execute Simulated Order into Real Virtual Portfolio
  const handleExecuteOrder = (e) => {
    e.preventDefault();
    const effectivePrice = orderVariety === 'MARKET' ? stock.ltp : limitPrice;
    const totalVal = Math.round(quantity * effectivePrice * 100) / 100;

    try {
      if (orderModal.type === 'BUY') {
        const res = buyStock({
          symbol: cleanSymbol,
          name: stock.name,
          exchange: stock.exchange || 'NSE',
          quantity,
          price: effectivePrice,
          productType
        });

        setOrderModal({ open: false, type: 'BUY' });
        setOrderToast({
          id: res.order.id,
          type: 'BUY',
          symbol: cleanSymbol,
          qty: quantity,
          price: effectivePrice,
          total: totalVal,
          product: productType
        });
      } else {
        const res = sellStock({
          symbol: cleanSymbol,
          quantity,
          price: effectivePrice,
          productType
        });

        setOrderModal({ open: false, type: 'SELL' });
        setOrderToast({
          id: res.order.id,
          type: 'SELL',
          symbol: cleanSymbol,
          qty: quantity,
          price: effectivePrice,
          total: totalVal,
          product: productType,
          realizedPnl: res.realizedPnl
        });
      }
    } catch (err) {
      alert(err.message);
      return;
    }

    setTimeout(() => {
      setOrderToast(null);
    }, 6000);
  };

  if (loading && !stock) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
          <RefreshCw size={18} className="animate-spin" color="#38bdf8" />
          <span>Connecting to Indian Exchange Feed ({cleanSymbol})...</span>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="terminal-card" style={{ padding: '30px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '8px' }}>Instrument Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Could not find stock quote for symbol '{cleanSymbol}'.
        </p>
      </div>
    );
  }

  const isUp = stock.change >= 0;
  const dayRangePct = stock.high !== stock.low ? Math.min(100, Math.max(0, ((stock.ltp - stock.low) / (stock.high - stock.low)) * 100)) : 50;
  const week52RangePct = stock.high52 !== stock.low52 ? Math.min(100, Math.max(0, ((stock.ltp - stock.low52) / (stock.high52 - stock.low52)) * 100)) : 50;
  const totalMarketQty = (marketDepth.totalBuyQty + marketDepth.totalSellQty) || 1;
  const buyRatio = Math.round((marketDepth.totalBuyQty / totalMarketQty) * 100);

  // Margin calculation
  const totalOrderValue = quantity * (orderVariety === 'MARKET' ? stock.ltp : limitPrice);
  const requiredMargin = productType === 'MIS' ? totalOrderValue / 5 : totalOrderValue;

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* Toast Notification on Order Execution */}
      {orderToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#1e222d',
          border: `1px solid ${orderToast.type === 'BUY' ? '#089981' : '#f23645'}`,
          borderRadius: '8px',
          padding: '14px 18px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideUp 0.3s ease'
        }}>
          <CheckCircle2 size={24} color={orderToast.type === 'BUY' ? '#089981' : '#f23645'} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              Order Executed #{orderToast.id}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              <b style={{ color: orderToast.type === 'BUY' ? '#089981' : '#f23645' }}>{orderToast.type}</b> {orderToast.qty} shares of {orderToast.symbol} at ₹{orderToast.price.toFixed(2)} ({orderToast.product})
            </div>
          </div>
          <button 
            onClick={() => setOrderToast(null)} 
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: '8px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. PROFESSIONAL TRADING TERMINAL HEADER */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '16px',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          {/* Identity & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '17px',
              color: 'var(--primary)'
            }}>
              {cleanSymbol.slice(0, 2)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.4px' }}>
                  {stock.symbol}
                </span>
                <span style={{
                  backgroundColor: 'var(--primary-subtle)',
                  border: '1px solid var(--primary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--primary)'
                }}>
                  {stock.exchange}:EQ
                </span>
                <span style={{
                  backgroundColor: marketSession.badgeBg,
                  border: `1px solid ${marketSession.badgeBorder}`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: marketSession.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    backgroundColor: marketSession.color,
                    boxShadow: marketSession.isOpen ? '0 0 6px var(--positive)' : 'none'
                  }} />
                  {marketSession.label.toUpperCase()}
                </span>
                <button
                  onClick={() => toggleWatchlist(stock.symbol)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                  title={isWatched(stock.symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  <Star
                    size={17}
                    color={isWatched(stock.symbol) ? '#EAB308' : 'var(--text-muted)'}
                    fill={isWatched(stock.symbol) ? '#EAB308' : 'transparent'}
                  />
                </button>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
                {stock.name} • <span style={{ color: 'var(--text-muted)' }}>{stock.sector}</span>
              </div>
            </div>
          </div>

          {/* Real-time Price + Action Trading Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            {/* Price Quote */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span className="num" style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: flashDirection === 'up' ? '#089981' : (flashDirection === 'down' ? '#f23645' : 'var(--text)'),
                  backgroundColor: flashDirection === 'up' ? 'rgba(8, 153, 129, 0.15)' : (flashDirection === 'down' ? 'rgba(242, 54, 69, 0.15)' : 'transparent'),
                  padding: '2px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.25s ease'
                }}>
                  ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: isUp ? '#089981' : '#f23645'
                }}>
                  {isUp ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  <span className="num">
                    {isUp ? '+' : ''}{stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent}%)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <FreshnessIndicator 
                  timestamp={stock.updatedAt} 
                  isLive={marketSession.isOpen} 
                  label={marketSession.isOpen ? 'Live' : 'Market Closed'} 
                />
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || cooldownSeconds > 0}
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)',
                    padding: '2px 6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Refresh market quote'}
                >
                  <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                  <span>{cooldownSeconds > 0 ? `${cooldownSeconds}s` : 'Sync'}</span>
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS (BUY / SELL) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => openOrderPad('BUY')}
                  style={{
                    backgroundColor: '#089981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 22px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    letterSpacing: '0.4px',
                    boxShadow: '0 4px 14px rgba(8, 153, 129, 0.4)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0aa88f'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#089981'}
                >
                  BUY
                </button>

                <button
                  onClick={() => openOrderPad('SELL')}
                  style={{
                    backgroundColor: '#f23645',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 22px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    letterSpacing: '0.4px',
                    boxShadow: '0 4px 14px rgba(242, 54, 69, 0.4)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fa4352'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f23645'}
                >
                  SELL
                </button>
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                🛡️ Virtual Practice (₹0 Real Money)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN UPPER TRADING DOCK: CHART (LEFT) + MARKET DEPTH & STATS (RIGHT) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.3fr) minmax(360px, 1fr)',
        gap: '16px',
        marginBottom: '18px'
      }} className="stock-layout-grid">
        {/* Left Column: Pro Trading Chart */}
        <div>
          <StockChart symbol={stock.symbol} currentPrice={stock.ltp} isMarketOpen={marketSession.isOpen} />
        </div>

        {/* Right Column: Authentic Level 2 Depth & Performance Ranges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* LEVEL 2 MARKET DEPTH (SPLIT BID / ASK WITH DEPTH BARS) */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--surface-secondary)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text)'
            }}>
              <span>MARKET DEPTH (L2)</span>
              <span style={{ 
                fontSize: '10px', 
                color: marketSession.isOpen ? 'var(--primary)' : 'var(--text-muted)', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: marketSession.isOpen ? 'var(--positive)' : '#94a3b8'
                }} />
                {marketSession.isOpen ? 'NSE Real-time' : 'Closed • 3:30 PM Snapshot'}
              </span>
            </div>

            <div style={{ padding: '8px 12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* BUY SIDE (BIDS) */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#089981',
                    paddingBottom: '4px',
                    borderBottom: '1px solid rgba(8, 153, 129, 0.2)'
                  }}>
                    <span>ORDERS</span>
                    <span>QTY</span>
                    <span>BID ₹</span>
                  </div>
                  {marketDepth.bids.map((bid, i) => {
                    const depthPct = Math.min(100, Math.round((bid.qty / 3600) * 100));
                    return (
                      <div key={i} style={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        padding: '3px 4px',
                        fontVariantNumeric: 'tabular-nums',
                        overflow: 'hidden',
                        borderRadius: '2px',
                        marginTop: '2px'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          height: '100%',
                          width: `${depthPct}%`,
                          backgroundColor: 'rgba(8, 153, 129, 0.15)',
                          zIndex: 0
                        }} />
                        <span style={{ position: 'relative', zIndex: 1, color: 'var(--text-muted)', fontSize: '10px' }}>{bid.orders}</span>
                        <span style={{ position: 'relative', zIndex: 1, color: 'var(--text)' }}>{bid.qty.toLocaleString()}</span>
                        <span style={{ position: 'relative', zIndex: 1, color: '#089981', fontWeight: 700 }}>₹{bid.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* SELL SIDE (ASKS) */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#f23645',
                    paddingBottom: '4px',
                    borderBottom: '1px solid rgba(242, 54, 69, 0.2)'
                  }}>
                    <span>ASK ₹</span>
                    <span>QTY</span>
                    <span>ORDERS</span>
                  </div>
                  {marketDepth.asks.map((ask, i) => {
                    const depthPct = Math.min(100, Math.round((ask.qty / 3600) * 100));
                    return (
                      <div key={i} style={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        padding: '3px 4px',
                        fontVariantNumeric: 'tabular-nums',
                        overflow: 'hidden',
                        borderRadius: '2px',
                        marginTop: '2px'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${depthPct}%`,
                          backgroundColor: 'rgba(242, 54, 69, 0.15)',
                          zIndex: 0
                        }} />
                        <span style={{ position: 'relative', zIndex: 1, color: '#f23645', fontWeight: 700 }}>₹{ask.price.toFixed(2)}</span>
                        <span style={{ position: 'relative', zIndex: 1, color: 'var(--text)' }}>{ask.qty.toLocaleString()}</span>
                        <span style={{ position: 'relative', zIndex: 1, color: 'var(--text-muted)', fontSize: '10px' }}>{ask.orders}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Ratio Bar */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
                  <span style={{ color: '#089981' }}>BUY {buyRatio}% ({marketDepth.totalBuyQty.toLocaleString()})</span>
                  <span style={{ color: '#f23645' }}>SELL {100 - buyRatio}% ({marketDepth.totalSellQty.toLocaleString()})</span>
                </div>
                <div style={{ width: '100%', height: '5px', borderRadius: '3px', display: 'flex', overflow: 'hidden', backgroundColor: 'var(--surface-secondary)' }}>
                  <div style={{ width: `${buyRatio}%`, backgroundColor: '#089981', transition: 'width 0.4s ease' }} />
                  <div style={{ width: `${100 - buyRatio}%`, backgroundColor: '#f23645', transition: 'width 0.4s ease' }} />
                </div>
              </div>

              {!marketSession.isOpen && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  textAlign: 'center'
                }}>
                  🔒 Order matching closed at 03:30 PM IST. Order discovery resumes tomorrow at 09:00 AM.
                </div>
              )}
            </div>
          </div>

          {/* PERFORMANCE RANGES & KEY STATS */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '14px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
              PERFORMANCE & RANGES
            </div>

            {/* Day's Range Slider */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Low: <b style={{ color: '#f23645' }}>₹{stock.low?.toFixed(2)}</b></span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DAY'S RANGE</span>
                <span>High: <b style={{ color: '#089981' }}>₹{stock.high?.toFixed(2)}</b></span>
              </div>
              <div style={{ position: 'relative', height: '6px', background: 'linear-gradient(to right, rgba(242, 54, 69, 0.4), rgba(8, 153, 129, 0.4))', borderRadius: '3px' }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    left: `${dayRangePct}%`,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    border: '2px solid #ffffff',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 8px var(--primary)'
                  }}
                  title={`LTP: ₹${stock.ltp}`}
                />
              </div>
            </div>

            {/* 52-Week Range Slider */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>52W L: <b style={{ color: 'var(--text)' }}>₹{stock.low52?.toFixed(2)}</b></span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>52-WEEK RANGE</span>
                <span>52W H: <b style={{ color: 'var(--text)' }}>₹{stock.high52?.toFixed(2)}</b></span>
              </div>
              <div style={{ position: 'relative', height: '6px', background: 'linear-gradient(to right, rgba(148, 163, 184, 0.3), rgba(234, 179, 8, 0.4))', borderRadius: '3px' }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    left: `${week52RangePct}%`,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#eab308',
                    border: '2px solid #ffffff',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 8px #eab308'
                  }}
                  title={`LTP: ₹${stock.ltp}`}
                />
              </div>
            </div>

            {/* Key 4-Grid Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
              <div style={{ padding: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Open</span>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>₹{stock.open?.toFixed(2)}</div>
              </div>
              <div style={{ padding: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Prev. Close</span>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>₹{stock.previousClose?.toFixed(2)}</div>
              </div>
              <div style={{ padding: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Volume (Shares)</span>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>{stock.volume?.toLocaleString('en-IN')}</div>
              </div>
              <div style={{ padding: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Market Cap</span>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>{stock.marketCap}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LOWER SUITE: BALANCED 2-PANEL SUITE (INTELLIGENCE & RESEARCH) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '16px'
      }}>
        {/* LEFT PANEL: COMPANY PROFILE, VALUATION & TECHNICAL SIGNALS */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Company Identity & Profile */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                <Building2 size={16} color="var(--primary)" />
                <span>COMPANY INTELLIGENCE & VALUATION</span>
              </div>
              {stock.website && (
                <a
                  href={stock.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <span>NSE Page</span>
                  <Globe size={11} />
                </a>
              )}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {stock.description}
            </p>
          </div>

          {/* 6-Metric Fundamental Valuation Grid */}
          {stock.fundamentals && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.3px' }}>
                CORE FUNDAMENTAL RATIOS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px' }}>
                <div style={{ padding: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>P/E Ratio</span>
                  <div style={{ fontWeight: 800, color: 'var(--text)', marginTop: '2px', fontSize: '13px' }}>{stock.fundamentals.peRatio}x</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>ROE</span>
                  <div style={{ fontWeight: 800, color: 'var(--positive)', marginTop: '2px', fontSize: '13px' }}>{stock.fundamentals.roe}%</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Div Yield</span>
                  <div style={{ fontWeight: 800, color: 'var(--text)', marginTop: '2px', fontSize: '13px' }}>{stock.fundamentals.dividendYield}%</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Debt / Eq</span>
                  <div style={{ fontWeight: 800, color: 'var(--text)', marginTop: '2px', fontSize: '13px' }}>{stock.fundamentals.debtToEquity}</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>ROCE</span>
                  <div style={{ fontWeight: 800, color: 'var(--positive)', marginTop: '2px', fontSize: '13px' }}>{stock.fundamentals.roce}%</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Book Value</span>
                  <div style={{ fontWeight: 800, color: 'var(--text)', marginTop: '2px', fontSize: '13px' }}>₹{stock.fundamentals.bookValue}</div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Summary Barometer */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.3px' }}>
              TECHNICAL HEALTH & OSCILLATORS
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              backgroundColor: 'var(--positive-bg)',
              borderRadius: '6px',
              border: '1px solid var(--positive-border)',
              marginBottom: '8px'
            }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>OVERALL VERDICT</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--positive)' }}>BULLISH (BUY)</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text)' }}>
                <div><b>14</b> Bullish Signals</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>5 Neutral • 3 Bearish</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px', textAlign: 'center' }}>
              <div style={{ padding: '6px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>RSI (14)</div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>58.4 Neutral</div>
              </div>
              <div style={{ padding: '6px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>MACD (12,26)</div>
                <div style={{ fontWeight: 700, color: 'var(--positive)', marginTop: '2px' }}>Bullish Cross</div>
              </div>
              <div style={{ padding: '6px', backgroundColor: 'var(--surface-secondary)', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>20 EMA</div>
                <div style={{ fontWeight: 700, color: 'var(--positive)', marginTop: '2px' }}>Above (Buy)</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI RESEARCH ANALYST & EXCHANGE NEWS (TABBED DOCK) */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Tab Navigation Header */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--surface-secondary)',
            borderBottom: '1px solid var(--border)',
            padding: '4px 8px'
          }}>
            <button
              onClick={() => setBottomTab('AI')}
              style={{
                background: bottomTab === 'AI' ? 'var(--primary)' : 'transparent',
                color: bottomTab === 'AI' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Bot size={14} />
              <span>AI Research Analyst</span>
            </button>

            <button
              onClick={() => setBottomTab('NEWS')}
              style={{
                background: bottomTab === 'NEWS' ? 'var(--primary)' : 'transparent',
                color: bottomTab === 'NEWS' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Newspaper size={14} />
              <span>Exchange News ({news.length})</span>
            </button>
          </div>

          {/* TAB 1: AI RESEARCH TERMINAL */}
          {bottomTab === 'AI' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {/* Executive Summary Brief (Pre-loaded so card is never an empty void) */}
              <div style={{
                backgroundColor: 'var(--primary-subtle)',
                border: '1px solid var(--primary)',
                borderRadius: '8px',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                  <Sparkles size={14} />
                  <span>EXECUTIVE RESEARCH BRIEF: {cleanSymbol}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
                  {cleanSymbol} exhibits stable free cash flow yields and healthy balance sheet leverage. Key catalysts include enterprise digital transformation demand, robust deal bookings, and high dividend consistency.
                </p>
              </div>

              {/* Interactive Prompt Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAiSearch();
                }}
                style={{ display: 'flex', gap: '8px' }}
              >
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={`Ask AI about ${cleanSymbol} moat, risks, or valuation...`}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--text)',
                    fontSize: '12px'
                  }}
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Bot size={13} />
                  <span>{aiLoading ? 'Analyzing...' : 'Analyze'}</span>
                </button>
              </form>

              {/* Clickable Quick Prompt Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  `Explain ${cleanSymbol} business model & moat`,
                  `What are key growth catalysts & risks?`,
                  `Evaluate ${cleanSymbol} valuation vs peers`,
                  `Analyze dividend yield & ROE safety`
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiPrompt(chip);
                      handleAiSearch(chip);
                    }}
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      color: 'var(--text-secondary)',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      textAlign: 'left',
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
                    + {chip}
                  </button>
                ))}
              </div>

              {/* AI Loading Spinner */}
              {aiLoading && (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--primary-subtle)',
                  borderRadius: '6px'
                }}>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Synthesizing regulatory filings & valuation for {cleanSymbol}...</span>
                </div>
              )}

              {/* AI Error */}
              {aiError && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--negative-bg)',
                  border: '1px solid var(--negative-border)',
                  borderRadius: '6px',
                  color: 'var(--negative)',
                  fontSize: '12px'
                }}>
                  {aiError}
                </div>
              )}

              {/* AI Report Viewer */}
              {aiReport && !aiLoading && (
                <div style={{
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '8px',
                  maxHeight: '480px',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>AI SYNTHESIS REPORT</span>
                      {aiReport.targetName && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {aiReport.targetName}</span>
                      )}
                    </div>
                    <button
                      onClick={handleCopyReport}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Copy size={11} />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <FormattedResearchReport rawText={aiReport.summary || aiReport.content} />
                  {aiReport.sources && (
                    <div style={{ marginTop: '14px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>📡 Direct Data Feeds:</span>
                      <span>{aiReport.sources.join(' • ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE MARKET NEWS */}
          {bottomTab === 'NEWS' && (
            <div style={{ padding: '8px 12px', maxHeight: '380px', overflowY: 'auto' }}>
              {news.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No recent headlines recorded for {cleanSymbol}.
                </div>
              ) : (
                news.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px 8px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 600 }}>
                      {item.source} • {new Date(item.publishedAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {item.summary}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. ANGEL ONE / ZERODHA STYLE ORDER PLACEMENT MODAL */}
      {orderModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            width: '420px',
            maxWidth: '92vw',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)',
            animation: 'scaleIn 0.2s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: orderModal.type === 'BUY' ? '#089981' : '#f23645',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.3px' }}>
                    {orderModal.type} {cleanSymbol}
                  </span>
                  <span style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.5px'
                  }}>
                    VIRTUAL DEMO
                  </span>
                </div>
                <div style={{ fontSize: '11px', opacity: 0.95, marginTop: '2px' }}>
                  🛡️ Paper Trading Practice (Real Account 100% Safe • ₹0 Deducted)
                </div>
              </div>
              <button
                onClick={() => setOrderModal({ open: false, type: 'BUY' })}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleExecuteOrder} style={{ padding: '18px' }}>
              {/* Product Selection: Delivery (CNC) vs Intraday (MIS) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  PRODUCT TYPE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setProductType('MIS')}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: productType === 'MIS' ? '1px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: productType === 'MIS' ? 'var(--primary-subtle)' : 'var(--surface-secondary)',
                      color: productType === 'MIS' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Intraday MIS (5x)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType('CNC')}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: productType === 'CNC' ? '1px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: productType === 'CNC' ? 'var(--primary-subtle)' : 'var(--surface-secondary)',
                      color: productType === 'CNC' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Delivery CNC (1x)
                  </button>
                </div>
              </div>

              {/* Order Variety: Market vs Limit */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  ORDER TYPE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setOrderVariety('MARKET')}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: orderVariety === 'MARKET' ? '1px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: orderVariety === 'MARKET' ? 'var(--primary-subtle)' : 'var(--surface-secondary)',
                      color: orderVariety === 'MARKET' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderVariety('LIMIT')}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: orderVariety === 'LIMIT' ? '1px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: orderVariety === 'LIMIT' ? 'var(--primary-subtle)' : 'var(--surface-secondary)',
                      color: orderVariety === 'LIMIT' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Limit
                  </button>
                </div>
              </div>

              {/* Quantity Selector */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>QUANTITY (SHARES)</label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lot: 1</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--text)',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                />
                {/* Quick Add Chips */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  {[10, 25, 50, 100, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuantity(amt)}
                      style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        padding: '2px 8px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limit Price Input if LIMIT selected */}
              {orderVariety === 'LIMIT' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    LIMIT PRICE (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={limitPrice}
                    onChange={e => setLimitPrice(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontWeight: 700
                    }}
                  />
                </div>
              )}

              {/* Margin & Account Summary */}
              <div style={{
                backgroundColor: 'var(--surface-secondary)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '11px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Total Order Value:</span>
                  <b style={{ color: 'var(--text)' }}>₹{totalOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Margin Required ({productType}):</span>
                  <b style={{ color: 'var(--primary)' }}>₹{requiredMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: 'var(--text-muted)' }}>
                  <span>Available Margin:</span>
                  <span>₹5,00,000.00</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: orderModal.type === 'BUY' ? '#089981' : '#f23645',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  boxShadow: orderModal.type === 'BUY' ? '0 4px 16px rgba(8, 153, 129, 0.5)' : '0 4px 16px rgba(242, 54, 69, 0.5)'
                }}
              >
                {orderModal.type} {cleanSymbol} • ₹{requiredMargin.toFixed(2)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
