/**
 * Indian Stock Market (NSE / BSE) Trading Hours Utility (IST / Asia/Kolkata)
 * 
 * Standard Schedule (Monday - Friday):
 * - 09:00 AM - 09:15 AM IST: Pre-Market Session
 * - 09:15 AM - 03:30 PM IST: Normal Continuous Trading (Market Open)
 * - 03:30 PM - 04:00 PM IST: Post-Closing Auction
 * - 04:00 PM - 09:00 AM IST: Market Closed
 * - Saturday & Sunday: Market Closed (Weekend)
 */

export function getIndianMarketStatus() {
  const now = new Date();

  // Convert to Asia/Kolkata date object
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = istDate.getDay(); // 0 = Sun, 6 = Sat
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const totalMins = hours * 60 + minutes;

  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    return {
      isOpen: false,
      isLive: false,
      status: 'Closed',
      label: 'Market Closed',
      sessionType: 'weekend',
      subText: 'Exchanges closed for weekend',
      nextEvent: 'Opens Monday at 09:15 AM IST',
      color: 'var(--text-muted)',
      badgeBg: 'var(--surface-secondary)',
      badgeBorder: 'var(--border)'
    };
  }

  // Pre-market: 09:00 - 09:15 (540 to 555 mins)
  if (totalMins >= 540 && totalMins < 555) {
    const minsToOpen = 555 - totalMins;
    return {
      isOpen: false,
      isLive: true,
      status: 'Pre-Open',
      label: 'Pre-Open Session',
      sessionType: 'pre-open',
      subText: `Regular trading in ${minsToOpen}m`,
      nextEvent: 'Continuous trading begins at 09:15 AM IST',
      color: '#d97706',
      badgeBg: 'rgba(217, 119, 6, 0.12)',
      badgeBorder: 'rgba(217, 119, 6, 0.3)'
    };
  }

  // Regular Trading Session: 09:15 - 15:30 (555 to 930 mins)
  if (totalMins >= 555 && totalMins < 930) {
    const minsLeft = 930 - totalMins;
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    const remainingStr = h > 0 ? `${h}h ${m}m left` : `${m}m left`;

    return {
      isOpen: true,
      isLive: true,
      status: 'Open',
      label: 'Market Open',
      sessionType: 'regular',
      subText: `Closes 3:30 PM (${remainingStr})`,
      nextEvent: `Market closes today at 03:30 PM IST (${remainingStr})`,
      color: 'var(--positive)',
      badgeBg: 'var(--positive-bg)',
      badgeBorder: 'var(--positive-border)'
    };
  }

  // Post-market: 15:30 - 16:00 (930 to 960 mins)
  if (totalMins >= 930 && totalMins <= 960) {
    return {
      isOpen: false,
      isLive: false,
      status: 'Post-Market',
      label: 'Post-Market Auction',
      sessionType: 'post-market',
      subText: 'Closing auction settlement',
      nextEvent: 'Exchanges close fully at 04:00 PM IST',
      color: '#0284c7',
      badgeBg: 'rgba(2, 132, 199, 0.12)',
      badgeBorder: 'rgba(2, 132, 199, 0.3)'
    };
  }

  // Normal Weekday Closed (before 09:00 or after 16:00)
  const nextOpenStr = totalMins < 540 ? 'Opens today at 09:15 AM IST' : 'Opens tomorrow at 09:15 AM IST';
  return {
    isOpen: false,
    isLive: false,
    status: 'Closed',
    label: 'Market Closed',
    sessionType: 'closed',
    subText: nextOpenStr,
    nextEvent: nextOpenStr,
    color: 'var(--text-muted)',
    badgeBg: 'var(--surface-secondary)',
    badgeBorder: 'var(--border)'
  };
}

export function isIndianMarketOpen() {
  return getIndianMarketStatus().isOpen;
}
