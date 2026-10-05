import React, { createContext, useContext, useState, useEffect } from 'react';

const PortfolioContext = createContext(null);

const STORAGE_KEY = 'sk_virtual_portfolio_v2';
const INITIAL_CAPITAL = 100000; // ₹1,00,000 (1 Lakh Virtual INR)

export function PortfolioProvider({ children }) {
  const [portfolio, setPortfolio] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse portfolio from localStorage', e);
    }
    return {
      initialCapital: INITIAL_CAPITAL,
      cashBalance: INITIAL_CAPITAL,
      realizedPnl: 0,
      holdings: [],
      orders: []
    };
  });

  // Save to localStorage on any state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    } catch (e) {
      console.warn('Failed to save portfolio', e);
    }
  }, [portfolio]);

  /**
   * Execute BUY Order
   */
  const buyStock = ({ symbol, name, exchange = 'NSE', quantity, price, productType = 'CNC' }) => {
    const qty = Number(quantity);
    const orderPrice = Number(price);
    const totalCost = Math.round(qty * orderPrice * 100) / 100;

    if (isNaN(qty) || qty <= 0) {
      throw new Error('Please enter a valid positive quantity.');
    }
    if (isNaN(orderPrice) || orderPrice <= 0) {
      throw new Error('Invalid order execution price.');
    }
    if (totalCost > portfolio.cashBalance) {
      const needed = (totalCost - portfolio.cashBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 });
      throw new Error(`Insufficient virtual funds! You need ₹${needed} more cash.`);
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      id: orderId,
      timestamp: new Date().toISOString(),
      symbol: symbol.toUpperCase(),
      name: name || `${symbol.toUpperCase()} Ltd.`,
      exchange,
      type: 'BUY',
      quantity: qty,
      price: orderPrice,
      total: totalCost,
      productType
    };

    setPortfolio(prev => {
      const existingIdx = prev.holdings.findIndex(h => h.symbol.toUpperCase() === symbol.toUpperCase());
      let updatedHoldings = [...prev.holdings];

      if (existingIdx !== -1) {
        // Calculate new weighted average price
        const current = updatedHoldings[existingIdx];
        const newTotalQty = current.quantity + qty;
        const newTotalInvested = current.totalInvested + totalCost;
        const newAvgPrice = Math.round((newTotalInvested / newTotalQty) * 100) / 100;

        updatedHoldings[existingIdx] = {
          ...current,
          quantity: newTotalQty,
          avgPrice: newAvgPrice,
          totalInvested: newTotalInvested,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new holding
        updatedHoldings.push({
          symbol: symbol.toUpperCase(),
          name: name || `${symbol.toUpperCase()} Ltd.`,
          exchange,
          quantity: qty,
          avgPrice: orderPrice,
          totalInvested: totalCost,
          productType,
          createdAt: new Date().toISOString()
        });
      }

      return {
        ...prev,
        cashBalance: Math.round((prev.cashBalance - totalCost) * 100) / 100,
        holdings: updatedHoldings,
        orders: [newOrder, ...prev.orders]
      };
    });

    return { success: true, order: newOrder };
  };

  /**
   * Execute SELL Order
   */
  const sellStock = ({ symbol, quantity, price, productType = 'CNC' }) => {
    const cleanSym = symbol.toUpperCase();
    const qty = Number(quantity);
    const orderPrice = Number(price);
    const totalProceeds = Math.round(qty * orderPrice * 100) / 100;

    const existingHolding = portfolio.holdings.find(h => h.symbol.toUpperCase() === cleanSym);
    if (!existingHolding || existingHolding.quantity < qty) {
      const currentQty = existingHolding ? existingHolding.quantity : 0;
      throw new Error(`You only hold ${currentQty} shares of ${cleanSym}. Cannot sell ${qty}.`);
    }

    // Calculate Realized P&L for sold shares
    const costBasis = qty * existingHolding.avgPrice;
    const realizedTradePnl = Math.round((totalProceeds - costBasis) * 100) / 100;

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      id: orderId,
      timestamp: new Date().toISOString(),
      symbol: cleanSym,
      name: existingHolding.name,
      exchange: existingHolding.exchange || 'NSE',
      type: 'SELL',
      quantity: qty,
      price: orderPrice,
      total: totalProceeds,
      productType,
      realizedPnl: realizedTradePnl
    };

    setPortfolio(prev => {
      let updatedHoldings = [];
      const current = prev.holdings.find(h => h.symbol.toUpperCase() === cleanSym);

      if (current.quantity === qty) {
        // Position completely closed, remove from holdings
        updatedHoldings = prev.holdings.filter(h => h.symbol.toUpperCase() !== cleanSym);
      } else {
        // Partial sell, reduce quantity
        const remainingQty = current.quantity - qty;
        const remainingInvested = Math.round(remainingQty * current.avgPrice * 100) / 100;
        updatedHoldings = prev.holdings.map(h => {
          if (h.symbol.toUpperCase() === cleanSym) {
            return {
              ...h,
              quantity: remainingQty,
              totalInvested: remainingInvested,
              updatedAt: new Date().toISOString()
            };
          }
          return h;
        });
      }

      return {
        ...prev,
        cashBalance: Math.round((prev.cashBalance + totalProceeds) * 100) / 100,
        realizedPnl: Math.round((prev.realizedPnl + realizedTradePnl) * 100) / 100,
        holdings: updatedHoldings,
        orders: [newOrder, ...prev.orders]
      };
    });

    return { success: true, order: newOrder, realizedPnl: realizedTradePnl };
  };

  /**
   * Reset Portfolio to Initial ₹10,00,000 Capital
   */
  const resetPortfolio = () => {
    const fresh = {
      initialCapital: INITIAL_CAPITAL,
      cashBalance: INITIAL_CAPITAL,
      realizedPnl: 0,
      holdings: [],
      orders: []
    };
    setPortfolio(fresh);
    localStorage.removeItem(STORAGE_KEY);
  };

  /**
   * Add virtual funds (optional booster)
   */
  const addFunds = (amount = 200000) => {
    setPortfolio(prev => ({
      ...prev,
      cashBalance: prev.cashBalance + amount
    }));
  };

  return (
    <PortfolioContext.Provider value={{
      portfolio,
      cashBalance: portfolio.cashBalance,
      holdings: portfolio.holdings,
      orders: portfolio.orders,
      realizedPnl: portfolio.realizedPnl,
      initialCapital: portfolio.initialCapital,
      buyStock,
      sellStock,
      resetPortfolio,
      addFunds
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
