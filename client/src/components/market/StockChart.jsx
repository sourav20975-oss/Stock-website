import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  createChart, 
  ColorType, 
  CrosshairMode, 
  LineStyle, 
  CandlestickSeries, 
  LineSeries, 
  AreaSeries, 
  HistogramSeries 
} from 'lightweight-charts';
import { 
  BarChart2, 
  TrendingUp, 
  Maximize2, 
  Minimize2, 
  Crosshair, 
  Ruler, 
  Minus, 
  Layers, 
  RotateCcw, 
  Camera, 
  Trash2, 
  Activity,
  Check,
  ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { useTheme } from '../../context/ThemeContext';

export default function StockChart({ symbol, currentPrice }) {
  const cleanSymbol = (symbol || 'TCS').toUpperCase();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Chart configuration state
  const [timeframe, setTimeframe] = useState('1m');
  const [chartType, setChartType] = useState('candle'); // 'candle', 'line', 'area'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState('crosshair'); // 'crosshair', 'horiz', 'ruler'
  
  // Indicators toggle
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

  // Drawing state
  const [priceLines, setPriceLines] = useState([]); // Array of created price lines
  const [rulerPoints, setRulerPoints] = useState([]); // [{ time, price, x, y }]
  const [rulerResult, setRulerResult] = useState(null);

  // Real-time hover inspection bar
  const [hoverData, setHoverData] = useState(null);
  const [liveQuote, setLiveQuote] = useState({ ltp: currentPrice || 0, change: 0, changePercent: 0 });

  // DOM and Instance Refs
  const containerRef = useRef(null);
  const chartWrapperRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const ema20SeriesRef = useRef(null);
  const ema50SeriesRef = useRef(null);
  const bollingerUpperRef = useRef(null);
  const bollingerMiddleRef = useRef(null);
  const bollingerLowerRef = useRef(null);
  const priceLineInstancesRef = useRef([]);

  // Data cache
  const candlesRef = useRef([]);
  const lastBarTimeRef = useRef(0);

  const timeframes = [
    { id: '1s', label: '1s Live', seconds: 1 },
    { id: '5s', label: '5s Live', seconds: 5 },
    { id: '30s', label: '30s', seconds: 30 },
    { id: '1m', label: '1m', seconds: 60 },
    { id: '5m', label: '5m', seconds: 300 },
    { id: '15m', label: '15m', seconds: 900 },
    { id: '1h', label: '1H', seconds: 3600 },
    { id: '1D', label: '1D', seconds: 86400 },
    { id: '1W', label: '1W', seconds: 604800 },
    { id: '1M', label: '1M', seconds: 2592000 }
  ];

  const currentTfObj = useMemo(() => {
    return timeframes.find(t => t.id === timeframe) || timeframes[3];
  }, [timeframe]);

  // Fullscreen ESC handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Calculate Technicals Helper Functions
  const calculateEMA = (candles, period) => {
    if (candles.length < period) return [];
    const k = 2 / (period + 1);
    const emaData = [];
    let prevEma = null;

    candles.forEach((c, idx) => {
      if (idx < period - 1) return;
      if (prevEma === null) {
        const sum = candles.slice(0, period).reduce((acc, curr) => acc + curr.close, 0);
        prevEma = sum / period;
      } else {
        prevEma = c.close * k + prevEma * (1 - k);
      }
      emaData.push({
        time: c.time,
        value: Math.round(prevEma * 100) / 100
      });
    });
    return emaData;
  };

  const calculateBollinger = (candles, period = 20, mult = 2) => {
    if (candles.length < period) return { upper: [], middle: [], lower: [] };
    const upper = [];
    const middle = [];
    const lower = [];

    for (let i = period - 1; i < candles.length; i++) {
      const slice = candles.slice(i - period + 1, i + 1);
      const mean = slice.reduce((sum, c) => sum + c.close, 0) / period;
      const variance = slice.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      upper.push({ time: candles[i].time, value: Math.round((mean + stdDev * mult) * 100) / 100 });
      middle.push({ time: candles[i].time, value: Math.round(mean * 100) / 100 });
      lower.push({ time: candles[i].time, value: Math.round((mean - stdDev * mult) * 100) / 100 });
    }
    return { upper, middle, lower };
  };

  // Helper to sanitize candles for Lightweight Charts (strictly ascending seconds timestamps)
  const sanitizeCandles = (rawCandles) => {
    if (!Array.isArray(rawCandles) || rawCandles.length === 0) return [];
    const sorted = [...rawCandles].sort((a, b) => {
      const tA = Math.floor(new Date(a.time || a.timestamp).getTime() / 1000);
      const tB = Math.floor(new Date(b.time || b.timestamp).getTime() / 1000);
      return tA - tB;
    });

    const result = [];
    let lastTime = -Infinity;

    for (const c of sorted) {
      let t = Math.floor(new Date(c.time || c.timestamp).getTime() / 1000);
      if (isNaN(t) || t <= 0) continue;
      if (t <= lastTime) {
        t = lastTime + 1; // strictly ascending required by Lightweight Charts
      }
      lastTime = t;

      const open = Number(c.open);
      const high = Number(c.high);
      const low = Number(c.low);
      const close = Number(c.close);
      const volume = Number(c.volume || 10000);

      result.push({
        time: t,
        open: isNaN(open) ? close : open,
        high: isNaN(high) ? close : Math.max(high, open, close),
        low: isNaN(low) ? close : Math.min(low, open, close),
        close: isNaN(close) ? open : close,
        volume
      });
    }
    return result;
  };

  // Initialize and build Chart
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy prior chart if any
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 480;

    const chartBg = isDark ? '#131722' : '#ffffff';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: chartBg },
        textColor: textColor,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
        fontSize: 11
      },
      grid: {
        vertLines: { color: gridColor, style: LineStyle.Dotted },
        horzLines: { color: gridColor, style: LineStyle.Dotted }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(71, 85, 105, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#2962ff'
        },
        horzLine: {
          color: isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(71, 85, 105, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#2962ff'
        }
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: ['1s', '5s', '30s'].includes(timeframe),
        rightOffset: 12,
        barSpacing: 8,
        minBarSpacing: 3
      },
      rightPriceScale: {
        borderColor: borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.22
        },
        autoScale: true
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    chartInstanceRef.current = chart;

    // 1. Add Main Series (Candle, Line, or Area)
    let mainSeries;
    if (chartType === 'line') {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#2962ff',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        priceFormat: { type: 'price', precision: 2, minMove: 0.05 }
      });
    } else if (chartType === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(41, 98, 255, 0.45)',
        bottomColor: 'rgba(41, 98, 255, 0.02)',
        lineColor: '#2962ff',
        lineWidth: 2,
        priceFormat: { type: 'price', precision: 2, minMove: 0.05 }
      });
    } else {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#089981',
        downColor: '#f23645',
        borderUpColor: '#089981',
        borderDownColor: '#f23645',
        wickUpColor: '#089981',
        wickDownColor: '#f23645',
        priceFormat: { type: 'price', precision: 2, minMove: 0.05 }
      });
    }
    mainSeriesRef.current = mainSeries;

    // 2. Add Volume Series (hide volume price line so it doesn't collide with price scale)
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '', // overlay mode
        priceLineVisible: false,
        lastValueVisible: false
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0
        }
      });
      volumeSeriesRef.current = volumeSeries;
    } else {
      volumeSeriesRef.current = null;
    }

    // 3. Add EMA 20 Series
    if (showEMA20) {
      ema20SeriesRef.current = chart.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 1.5,
        title: 'EMA 20',
        priceLineVisible: false
      });
    } else {
      ema20SeriesRef.current = null;
    }

    // 4. Add EMA 50 Series
    if (showEMA50) {
      ema50SeriesRef.current = chart.addSeries(LineSeries, {
        color: '#fb923c',
        lineWidth: 1.5,
        title: 'EMA 50',
        priceLineVisible: false
      });
    } else {
      ema50SeriesRef.current = null;
    }

    // 5. Add Bollinger Bands Series
    if (showBollinger) {
      bollingerUpperRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(217, 70, 239, 0.7)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'BB Upper',
        priceLineVisible: false
      });
      bollingerMiddleRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(168, 85, 247, 0.8)',
        lineWidth: 1,
        title: 'BB Basis',
        priceLineVisible: false
      });
      bollingerLowerRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(217, 70, 239, 0.7)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'BB Lower',
        priceLineVisible: false
      });
    } else {
      bollingerUpperRef.current = null;
      bollingerMiddleRef.current = null;
      bollingerLowerRef.current = null;
    }

    // Subscribe to crosshair movement for the dynamic TradingView legend
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData || !mainSeriesRef.current) {
        if (candlesRef.current.length > 0) {
          const last = candlesRef.current[candlesRef.current.length - 1];
          setHoverData({
            time: last.time,
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
            volume: last.volume
          });
        }
        return;
      }

      const data = param.seriesData.get(mainSeriesRef.current);
      if (data) {
        setHoverData({
          time: param.time,
          open: data.open !== undefined ? data.open : data.value,
          high: data.high !== undefined ? data.high : data.value,
          low: data.low !== undefined ? data.low : data.value,
          close: data.close !== undefined ? data.close : data.value,
          volume: data.volume || (candlesRef.current.find(c => c.time === param.time)?.volume) || 0
        });
      }
    });

    // Handle Click for Drawings & Tools (Horizontal line & Ruler)
    chart.subscribeClick((param) => {
      if (!param || !param.point || !mainSeriesRef.current) return;
      const clickedPrice = mainSeriesRef.current.coordinateToPrice(param.point.y);
      if (!clickedPrice) return;

      if (activeTool === 'horiz') {
        const roundedPrice = Math.round(clickedPrice * 100) / 100;
        const line = mainSeriesRef.current.createPriceLine({
          price: roundedPrice,
          color: '#38bdf8',
          lineWidth: 1.5,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Level ₹${roundedPrice.toFixed(2)}`
        });
        priceLineInstancesRef.current.push(line);
        setPriceLines(prev => [...prev, { id: Date.now(), price: roundedPrice, instance: line }]);
        setActiveTool('crosshair'); // return to crosshair
      } else if (activeTool === 'ruler') {
        const newPt = {
          time: param.time,
          price: Math.round(clickedPrice * 100) / 100,
          x: param.point.x,
          y: param.point.y
        };

        if (rulerPoints.length === 0) {
          setRulerPoints([newPt]);
          setRulerResult(null);
        } else {
          const pt1 = rulerPoints[0];
          const diff = newPt.price - pt1.price;
          const pct = (diff / pt1.price) * 100;
          setRulerResult({
            p1: pt1,
            p2: newPt,
            diff: Math.round(diff * 100) / 100,
            pct: Math.round(pct * 100) / 100
          });
          setRulerPoints([]);
        }
      }
    });

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !chartInstanceRef.current) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        chartInstanceRef.current.applyOptions({ width, height });
      }
    });

    resizeObserver.observe(container);

    // Initial Fetch & Population
    const apiTf = ['1D', '1W', '1M', '1Y'].includes(timeframe) ? timeframe : '1D';
    api.getStockHistory(cleanSymbol, apiTf)
      .then(res => {
        if (!res.success || !res.data?.candles || res.data.candles.length === 0) return;
        const clean = sanitizeCandles(res.data.candles);
        if (clean.length === 0) return;

        candlesRef.current = clean;
        lastBarTimeRef.current = clean[clean.length - 1].time;

        // Set Main Series Data
        if (chartType === 'line' || chartType === 'area') {
          mainSeriesRef.current?.setData(clean.map(c => ({ time: c.time, value: c.close })));
        } else {
          mainSeriesRef.current?.setData(clean);
        }

        // Set Volume Data
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(clean.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(8, 153, 129, 0.4)' : 'rgba(242, 54, 69, 0.4)'
          })));
        }

        // Set EMA 20
        if (ema20SeriesRef.current) {
          const ema20 = calculateEMA(clean, 20);
          ema20SeriesRef.current.setData(ema20);
        }

        // Set EMA 50
        if (ema50SeriesRef.current) {
          const ema50 = calculateEMA(clean, 50);
          ema50SeriesRef.current.setData(ema50);
        }

        // Set Bollinger Bands
        if (bollingerUpperRef.current && bollingerMiddleRef.current && bollingerLowerRef.current) {
          const bb = calculateBollinger(clean, 20, 2);
          bollingerUpperRef.current.setData(bb.upper);
          bollingerMiddleRef.current.setData(bb.middle);
          bollingerLowerRef.current.setData(bb.lower);
        }

        const last = clean[clean.length - 1];
        setHoverData(last);
        setLiveQuote({
          ltp: last.close,
          change: Math.round((last.close - clean[0].open) * 100) / 100,
          changePercent: Math.round(((last.close - clean[0].open) / clean[0].open) * 10000) / 100
        });

        chart.timeScale().fitContent();
      })
      .catch(err => console.error('Failed to load stock candles:', err));

    return () => {
      resizeObserver.disconnect();
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [cleanSymbol, timeframe, chartType, showVolume, showEMA20, showEMA50, showBollinger, theme]);

  // Real-time live websocket price tick & bar formation
  useEffect(() => {
    if (!cleanSymbol) return;

    const intervalSec = currentTfObj.seconds;

    const handleTick = (tick) => {
      if (!tick || !tick.ltp || !mainSeriesRef.current || candlesRef.current.length === 0) return;

      const newPrice = Number(tick.ltp);
      const cleanList = candlesRef.current;
      const lastCandle = { ...cleanList[cleanList.length - 1] };
      const nowSec = Math.floor(Date.now() / 1000);

      // Check if bar timeframe expired, start new bar
      if (nowSec - lastCandle.time >= intervalSec) {
        const newBarTime = lastCandle.time + intervalSec;
        const newBar = {
          time: newBarTime,
          open: newPrice,
          high: newPrice,
          low: newPrice,
          close: newPrice,
          volume: 250
        };
        cleanList.push(newBar);
        candlesRef.current = cleanList;

        if (chartType === 'line' || chartType === 'area') {
          mainSeriesRef.current.update({ time: newBar.time, value: newPrice });
        } else {
          mainSeriesRef.current.update(newBar);
        }

        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: newBar.time,
            value: newBar.volume,
            color: 'rgba(8, 153, 129, 0.4)'
          });
        }
      } else {
        // Update current existing bar
        lastCandle.high = Math.max(lastCandle.high, newPrice);
        lastCandle.low = Math.min(lastCandle.low, newPrice);
        lastCandle.close = newPrice;
        lastCandle.volume = (lastCandle.volume || 1000) + 50;
        cleanList[cleanList.length - 1] = lastCandle;

        if (chartType === 'line' || chartType === 'area') {
          mainSeriesRef.current.update({ time: lastCandle.time, value: newPrice });
        } else {
          mainSeriesRef.current.update(lastCandle);
        }

        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: lastCandle.time,
            value: lastCandle.volume,
            color: lastCandle.close >= lastCandle.open ? 'rgba(8, 153, 129, 0.4)' : 'rgba(242, 54, 69, 0.4)'
          });
        }
      }

      setHoverData(lastCandle);
      setLiveQuote(prev => ({
        ltp: newPrice,
        change: tick.change !== undefined ? tick.change : prev.change,
        changePercent: tick.changePercent !== undefined ? tick.changePercent : prev.changePercent
      }));
    };

    socketService.subscribeStock(cleanSymbol, handleTick);

    return () => {
      socketService.unsubscribeStock(cleanSymbol, handleTick);
    };
  }, [cleanSymbol, currentTfObj, chartType]);

  // Clear all drawings
  const handleClearDrawings = () => {
    priceLineInstancesRef.current.forEach(line => {
      try {
        mainSeriesRef.current?.removePriceLine(line);
      } catch (e) {
        // ignore
      }
    });
    priceLineInstancesRef.current = [];
    setPriceLines([]);
    setRulerPoints([]);
    setRulerResult(null);
  };

  // Reset Zoom
  const handleResetZoom = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().fitContent();
    }
  };

  // Snapshot / Download Chart Image
  const handleScreenshot = () => {
    if (!chartInstanceRef.current) return;
    const canvas = chartInstanceRef.current.takeScreenshot();
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanSymbol}_TradingChart_${timeframe}.png`;
    a.click();
  };

  const isUp = (hoverData ? hoverData.close >= hoverData.open : liveQuote.change >= 0);

  return (
    <div 
      ref={chartWrapperRef}
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '530px',
        zIndex: isFullscreen ? 99999 : 1,
        backgroundColor: isDark ? '#131722' : 'var(--surface)',
        borderRadius: isFullscreen ? 0 : '10px',
        border: isFullscreen ? 'none' : '1px solid var(--border)',
        boxShadow: isFullscreen ? 'none' : 'var(--card-shadow)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: 'var(--text)',
        userSelect: 'none'
      }}
    >
      {/* 1. TOP TRADINGVIEW / ANGEL ONE PRO TOOLBAR */}
      <div style={{
        height: '40px',
        backgroundColor: isDark ? '#171b26' : 'var(--surface-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        fontSize: '11px',
        gap: '6px'
      }}>
        {/* Left Side: Symbol Pill & Intervals */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '2px 7px',
            borderRadius: '4px',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '0.3px',
            fontSize: '11px'
          }}>
            <span>{cleanSymbol}</span>
            <span style={{ fontSize: '9px', color: 'var(--primary)', fontWeight: 700 }}>NSE</span>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)' }} />

          {/* Core Timeframe Selectors (Compact Pills) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {[
              { id: '1s', label: '1s' },
              { id: '30s', label: '30s' },
              { id: '1m', label: '1m' },
              { id: '5m', label: '5m' },
              { id: '15m', label: '15m' },
              { id: '1D', label: '1D' },
              { id: '1W', label: '1W' }
            ].map(tf => {
              const active = timeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  style={{
                    background: active ? 'var(--primary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '3px 6px',
                    fontSize: '10px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)' }} />

          {/* Compact Chart Type Segmented Control */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '2px',
            gap: '1px'
          }}>
            <button
              onClick={() => setChartType('candle')}
              style={{
                background: chartType === 'candle' ? 'var(--primary)' : 'transparent',
                color: chartType === 'candle' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 600
              }}
              title="Candlestick Chart"
            >
              <BarChart2 size={12} />
              <span>Candles</span>
            </button>

            <button
              onClick={() => setChartType('line')}
              style={{
                background: chartType === 'line' ? 'var(--primary)' : 'transparent',
                color: chartType === 'line' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 600
              }}
              title="Line Chart"
            >
              <TrendingUp size={12} />
              <span>Line</span>
            </button>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)' }} />

          {/* Indicators Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowIndicatorMenu(prev => !prev)}
              style={{
                background: showIndicatorMenu ? 'var(--primary-subtle)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'var(--surface)'),
                color: showIndicatorMenu ? 'var(--primary)' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '3px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 600
              }}
            >
              <Layers size={12} />
              <span>Indicators</span>
              <ChevronDown size={10} />
            </button>

            {showIndicatorMenu && (
              <div style={{
                position: 'absolute',
                top: '30px',
                left: 0,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px',
                width: '180px',
                boxShadow: 'var(--card-shadow)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <div 
                  onClick={() => setShowEMA20(p => !p)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text)',
                    backgroundColor: showEMA20 ? 'var(--primary-subtle)' : 'transparent'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                    EMA 20
                  </span>
                  {showEMA20 && <Check size={12} color="var(--primary)" />}
                </div>

                <div 
                  onClick={() => setShowEMA50(p => !p)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text)',
                    backgroundColor: showEMA50 ? 'rgba(251, 146, 60, 0.15)' : 'transparent'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fb923c' }} />
                    EMA 50
                  </span>
                  {showEMA50 && <Check size={12} color="#fb923c" />}
                </div>

                <div 
                  onClick={() => setShowBollinger(p => !p)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text)',
                    backgroundColor: showBollinger ? 'rgba(217, 70, 239, 0.15)' : 'transparent'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d946ef' }} />
                    Bollinger Bands
                  </span>
                  {showBollinger && <Check size={12} color="#d946ef" />}
                </div>

                <div 
                  onClick={() => setShowVolume(p => !p)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text)',
                    backgroundColor: showVolume ? 'var(--positive-bg)' : 'transparent'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#089981' }} />
                    Volume Bars
                  </span>
                  {showVolume && <Check size={12} color="#089981" />}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tools, Snapshot, Reset & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button
            onClick={handleResetZoom}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer'
            }}
            title="Reset Chart Zoom"
          >
            <RotateCcw size={13} />
          </button>

          <button
            onClick={handleScreenshot}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer'
            }}
            title="Take Chart Snapshot"
          >
            <Camera size={13} />
          </button>

          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            style={{
              background: isFullscreen ? 'var(--primary)' : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--surface)'),
              color: isFullscreen ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* 2. LIVE OHLCV TICKER & METRICS BAR */}
      <div style={{
        height: '28px',
        backgroundColor: isDark ? '#131722' : 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        fontSize: '11px',
        fontVariantNumeric: 'tabular-nums',
        gap: '12px',
        color: 'var(--text-secondary)',
        overflowX: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#089981',
            boxShadow: '0 0 6px #089981'
          }} />
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>LIVE</span>
        </div>

        {hoverData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>O: <b style={{ color: 'var(--text)' }}>₹{hoverData.open?.toFixed(2)}</b></span>
            <span>H: <b style={{ color: '#089981' }}>₹{hoverData.high?.toFixed(2)}</b></span>
            <span>L: <b style={{ color: '#f23645' }}>₹{hoverData.low?.toFixed(2)}</b></span>
            <span>C: <b style={{ color: isUp ? '#089981' : '#f23645' }}>₹{hoverData.close?.toFixed(2)}</b></span>
            <span>Vol: <b style={{ color: 'var(--primary)' }}>{hoverData.volume ? (hoverData.volume > 100000 ? `${(hoverData.volume / 100000).toFixed(1)}L` : `${(hoverData.volume / 1000).toFixed(1)}K`) : '—'}</b></span>
          </div>
        )}

        {showEMA20 && <span style={{ color: '#38bdf8' }}>EMA 20</span>}
        {showEMA50 && <span style={{ color: '#fb923c' }}>EMA 50</span>}
        {showBollinger && <span style={{ color: '#d946ef' }}>Bollinger (20, 2)</span>}

        {activeTool === 'horiz' && (
          <span style={{ color: 'var(--primary)', fontWeight: 600, animation: 'pulse 1s infinite' }}>
            ● Click anywhere on chart to drop Price Level
          </span>
        )}

        {activeTool === 'ruler' && (
          <span style={{ color: '#eab308', fontWeight: 600 }}>
            {rulerPoints.length === 0 ? '● Click 1st point to start ruler' : '● Click 2nd point to measure distance'}
          </span>
        )}
      </div>

      {/* 3. CHART MAIN WORKSPACE: LEFT TOOLS + CANVAS */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        minHeight: 0
      }}>
        {/* Left Side Drawing Tools Rail (TradingView Pro Style) */}
        <div style={{
          width: '40px',
          backgroundColor: isDark ? '#171b26' : 'var(--surface-secondary)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0',
          gap: '6px',
          zIndex: 10
        }}>
          {/* Crosshair Cursor */}
          <button
            onClick={() => setActiveTool('crosshair')}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              border: 'none',
              background: activeTool === 'crosshair' ? 'var(--primary)' : 'transparent',
              color: activeTool === 'crosshair' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Crosshair Cursor"
          >
            <Crosshair size={15} />
          </button>

          {/* Horizontal Ray / Price Level Tool */}
          <button
            onClick={() => setActiveTool('horiz')}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              border: 'none',
              background: activeTool === 'horiz' ? 'var(--primary)' : 'transparent',
              color: activeTool === 'horiz' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Horizontal Support/Resistance Line (Click to plant)"
          >
            <Minus size={16} />
          </button>

          {/* Ruler / Measure Tool */}
          <button
            onClick={() => {
              setActiveTool('ruler');
              setRulerPoints([]);
              setRulerResult(null);
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              border: 'none',
              background: activeTool === 'ruler' ? 'var(--primary)' : 'transparent',
              color: activeTool === 'ruler' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Measure Price & % Range (Ruler)"
          >
            <Ruler size={15} />
          </button>

          <div style={{ width: '20px', height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

          {/* Clear Drawings Button */}
          <button
            onClick={handleClearDrawings}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              color: 'var(--negative)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Clear All Price Lines & Ruler"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Real TradingView Canvas Container */}
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
          {/* Subtle Watermark */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '64px',
            fontWeight: 900,
            color: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.03)',
            letterSpacing: '4px',
            pointerEvents: 'none',
            zIndex: 0
          }}>
            {cleanSymbol}
          </div>

          {/* Lightweight Charts Mount Element */}
          <div 
            ref={containerRef} 
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
          />

          {/* Floating Ruler Measure HUD Card */}
          {rulerResult && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '70px',
              backgroundColor: rulerResult.diff >= 0 ? 'rgba(8, 153, 129, 0.95)' : 'rgba(242, 54, 69, 0.95)',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Ruler size={14} />
              <span>
                {rulerResult.diff >= 0 ? '+' : ''}₹{rulerResult.diff.toFixed(2)} ({rulerResult.pct >= 0 ? '+' : ''}{rulerResult.pct}%)
              </span>
              <button
                onClick={() => setRulerResult(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '14px',
                  marginLeft: '4px'
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
