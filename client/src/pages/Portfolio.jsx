import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw, 
  RotateCcw, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  History, 
  PieChart, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { api } from '../services/api';

export default function Portfolio() {
  const { 
    cashBalance, 
    holdings, 
    orders, 
    realizedPnl, 
    initialCapital, 
    sellStock, 
    buyStock, 
    resetPortfolio, 
    addFunds 
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState('holdings'); // 'holdings', 'orders', 'analytics'
  const [liveQuotes, setLiveQuotes] = useState({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [sellModal, setSellModal] = useState({ open: false, holding: null, qty: 1 });
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch latest real live prices for all held stocks
  const refreshHoldingsQuotes = async () => {
    if (holdings.length === 0) return;
    setLoadingQuotes(true);
    try {
      const quotePromises = holdings.map(h => 
        api.getStockQuote(h.symbol)
          .then(res => ({ symbol: h.symbol, data: res.data }))
          .catch(() => null)
      );
      const results = await Promise.all(quotePromises);
      const newQuotes = {};
      results.forEach(r => {
        if (r && r.data) {
          newQuotes[r.symbol.toUpperCase()] = r.data.ltp;
        }
      });
      setLiveQuotes(prev => ({ ...prev, ...newQuotes }));
    } catch (e) {
      console.warn('Failed to refresh holding quotes:', e);
    } finally {
      setLoadingQuotes(false);
    }
  };

  useEffect(() => {
    refreshHoldingsQuotes();
    const interval = setInterval(refreshHoldingsQuotes, 10000);
    return () => clearInterval(interval);
  }, [holdings]);

  // Calculate Real-time Portfolio Totals
  let totalInvested = 0;
  let totalCurrentValue = 0;

  holdings.forEach(h => {
    const ltp = liveQuotes[h.symbol.toUpperCase()] || h.avgPrice;
    totalInvested += h.totalInvested;
    totalCurrentValue += h.quantity * ltp;
  });

  const totalPortfolioValue = Math.round((cashBalance + totalCurrentValue) * 100) / 100;
  const unrealizedPnl = Math.round((totalCurrentValue - totalInvested) * 100) / 100;
  const totalReturn = Math.round((totalPortfolioValue - initialCapital) * 100) / 100;
  const totalReturnPercent = initialCapital > 0 ? Math.round((totalReturn / initialCapital) * 10000) / 100 : 0;
  const unrealizedPercent = totalInvested > 0 ? Math.round((unrealizedPnl / totalInvested) * 10000) / 100 : 0;

  // Handle Sell Action
  const handleConfirmSell = (e) => {
    e.preventDefault();
    if (!sellModal.holding) return;

    try {
      const currentPrice = liveQuotes[sellModal.holding.symbol.toUpperCase()] || sellModal.holding.avgPrice;
      const res = sellStock({
        symbol: sellModal.holding.symbol,
        quantity: sellModal.qty,
        price: currentPrice
      });

      setSellModal({ open: false, holding: null, qty: 1 });
      setToastMessage({
        type: 'success',
        text: `Sold ${sellModal.qty} shares of ${sellModal.holding.symbol} at ₹${currentPrice}. P&L: ${res.realizedPnl >= 0 ? '+' : ''}₹${res.realizedPnl}`
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message });
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 1000,
          backgroundColor: toastMessage.type === 'success' ? '#089981' : '#f23645',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header Bar */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              Virtual Paper Trading Portfolio
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(8, 153, 129, 0.15)',
              color: '#089981',
              border: '1px solid rgba(8, 153, 129, 0.3)'
            }}>
              🛡️ ₹0 Real Risk
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Execute real-time simulated trades on NSE/BSE stocks with ₹1 Lakh virtual seed capital.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => refreshHoldingsQuotes()}
            disabled={loadingQuotes}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
            title="Update holding prices from live exchange"
          >
            <RefreshCw size={13} className={loadingQuotes ? 'animate-spin' : ''} />
            <span>Sync Live Prices</span>
          </button>

          <button
            onClick={() => addFunds(25000)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', color: 'var(--primary)' }}
            title="Add ₹25,000 virtual balance"
          >
            <PlusCircle size={13} />
            <span>+₹25k Cash</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset your portfolio to initial ₹1,00,000 cash? All holdings will be cleared.')) {
                resetPortfolio();
              }
            }}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', color: 'var(--text-muted)' }}
            title="Reset portfolio to ₹1 Lakh"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Portfolio Summary Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px'
      }}>
        {/* Card 1: Total Portfolio Value */}
        <div className="terminal-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            TOTAL PORTFOLIO VALUE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              ₹{totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', marginTop: '6px', fontWeight: 600, color: totalReturn >= 0 ? '#089981' : '#f23645' }}>
            {totalReturn >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{totalReturn >= 0 ? '+' : ''}₹{totalReturn.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({totalReturn >= 0 ? '+' : ''}{totalReturnPercent}%) overall</span>
          </div>
        </div>

        {/* Card 2: Unrealized P&L */}
        <div className="terminal-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            UNREALIZED P&L (OPEN POSITIONS)
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: unrealizedPnl >= 0 ? '#089981' : '#f23645' }}>
              {unrealizedPnl >= 0 ? '+' : ''}₹{unrealizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Return on active holdings: <strong style={{ color: unrealizedPnl >= 0 ? '#089981' : '#f23645' }}>{unrealizedPnl >= 0 ? '+' : ''}{unrealizedPercent}%</strong>
          </div>
        </div>

        {/* Card 3: Realized Booked P&L */}
        <div className="terminal-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            REALIZED BOOKED P&L
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: realizedPnl >= 0 ? '#089981' : '#f23645' }}>
              {realizedPnl >= 0 ? '+' : ''}₹{realizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Net profit/loss booked from sold trades
          </div>
        </div>

        {/* Card 4: Available Cash vs Invested */}
        <div className="terminal-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            AVAILABLE TRADING CASH
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)' }}>
              ₹{cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Invested: <strong>₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> ({holdings.length} stocks)
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('holdings')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: '6px 6px 0 0',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'holdings' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'holdings' ? '2px solid var(--primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Briefcase size={15} />
          <span>Active Holdings ({holdings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: '6px 6px 0 0',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <History size={15} />
          <span>Order History ({orders.length})</span>
        </button>
      </div>

      {/* 4. Tab 1: Holdings Table */}
      {activeTab === 'holdings' && (
        <div className="terminal-card" style={{ overflow: 'hidden' }}>
          {holdings.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💼</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>
                Your Virtual Portfolio is Empty
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 18px auto' }}>
                You have ₹10,00,000 cash ready. Search any Indian stock or browse top movers and click <strong>BUY</strong> to start paper trading!
              </p>
              <Link to="/stocks" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', textDecoration: 'none' }}>
                Explore Stocks to Buy →
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Stock Instrument</th>
                    <th style={{ padding: '12px 12px', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '12px 12px', textAlign: 'right' }}>Avg Buy Price</th>
                    <th style={{ padding: '12px 12px', textAlign: 'right' }}>Current LTP</th>
                    <th style={{ padding: '12px 12px', textAlign: 'right' }}>Invested Val</th>
                    <th style={{ padding: '12px 12px', textAlign: 'right' }}>Current Val</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Unrealized P&L</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => {
                    const ltp = liveQuotes[h.symbol.toUpperCase()] || h.avgPrice;
                    const curVal = h.quantity * ltp;
                    const pnl = Math.round((curVal - h.totalInvested) * 100) / 100;
                    const pnlPct = Math.round((pnl / h.totalInvested) * 10000) / 100;
                    const isProfitable = pnl >= 0;

                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s ease' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <Link to={`/stocks/${h.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{h.symbol}</span>
                            <span style={{ fontSize: '10px', color: 'var(--primary)', backgroundColor: 'var(--surface-secondary)', padding: '1px 5px', borderRadius: '3px' }}>
                              {h.exchange}
                            </span>
                          </Link>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {h.name}
                          </div>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600 }}>
                          {h.quantity.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }} className="num">
                          ₹{h.avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700 }} className="num">
                          ₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }} className="num">
                          ₹{h.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700 }} className="num">
                          ₹{curVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: isProfitable ? '#089981' : '#f23645' }} className="num">
                            {isProfitable ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: '11px', color: isProfitable ? '#089981' : '#f23645', fontWeight: 600 }}>
                            {isProfitable ? '+' : ''}{pnlPct}%
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Link
                              to={`/stocks/${h.symbol}`}
                              style={{
                                textDecoration: 'none',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: 'rgba(8, 153, 129, 0.12)',
                                color: '#089981',
                                border: '1px solid rgba(8, 153, 129, 0.3)'
                              }}
                            >
                              BUY MORE
                            </Link>

                            <button
                              onClick={() => setSellModal({ open: true, holding: h, qty: h.quantity })}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: 'rgba(242, 54, 69, 0.12)',
                                color: '#f23645',
                                border: '1px solid rgba(242, 54, 69, 0.3)',
                                cursor: 'pointer'
                              }}
                            >
                              SELL / EXIT
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Orders History */}
      {activeTab === 'orders' && (
        <div className="terminal-card" style={{ overflow: 'hidden' }}>
          {orders.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No orders placed yet. Trade stocks to see execution logs here.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Order ID</th>
                    <th style={{ padding: '12px 12px' }}>Timestamp</th>
                    <th style={{ padding: '12px 12px' }}>Symbol</th>
                    <th style={{ padding: '12px 12px' }}>Side</th>
                    <th style={{ padding: '12px 12px', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '12px 12px', textAlign: 'right' }}>Executed Price</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Value</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Realized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord, idx) => {
                    const isBuy = ord.type === 'BUY';
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          {ord.id}
                        </td>
                        <td style={{ padding: '12px 12px', color: 'var(--text-secondary)' }}>
                          {new Date(ord.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {new Date(ord.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px 12px', fontWeight: 700 }}>
                          <Link to={`/stocks/${ord.symbol}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                            {ord.symbol}
                          </Link>
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 800,
                            backgroundColor: isBuy ? 'rgba(8, 153, 129, 0.15)' : 'rgba(242, 54, 69, 0.15)',
                            color: isBuy ? '#089981' : '#f23645'
                          }}>
                            {ord.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 600 }}>
                          {ord.quantity.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'right' }} className="num">
                          ₹{ord.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }} className="num">
                          ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>
                          {ord.realizedPnl !== undefined ? (
                            <span style={{ color: ord.realizedPnl >= 0 ? '#089981' : '#f23645' }} className="num">
                              {ord.realizedPnl >= 0 ? '+' : ''}₹{ord.realizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. Quick Sell Order Modal */}
      {sellModal.open && sellModal.holding && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '420px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                  Sell {sellModal.holding.symbol}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  You currently hold {sellModal.holding.quantity} shares
                </span>
              </div>
              <button
                onClick={() => setSellModal({ open: false, holding: null, qty: 1 })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSell} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Quantity to Sell (Max: {sellModal.holding.quantity})
                </label>
                <input
                  type="number"
                  min="1"
                  max={sellModal.holding.quantity}
                  value={sellModal.qty}
                  onChange={e => setSellModal(prev => ({ ...prev, qty: Math.min(prev.holding.quantity, Math.max(1, Number(e.target.value))) }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-secondary)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                  required
                />
              </div>

              <div style={{
                backgroundColor: 'var(--surface-secondary)',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Market Price:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                    ₹{(liveQuotes[sellModal.holding.symbol.toUpperCase()] || sellModal.holding.avgPrice).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Proceeds:</span>
                  <span style={{ fontWeight: 700, color: '#089981' }}>
                    ₹{((liveQuotes[sellModal.holding.symbol.toUpperCase()] || sellModal.holding.avgPrice) * sellModal.qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSellModal({ open: false, holding: null, qty: 1 })}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    backgroundColor: '#f23645',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Confirm Sell Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
