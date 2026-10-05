import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1 }}>
        <div className="hide-on-mobile">
          <Sidebar />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <main style={{
            flex: 1,
            padding: '24px 28px',
            maxWidth: '1440px',
            margin: '0 auto',
            width: '100%',
            overflowX: 'hidden',
            paddingBottom: '40px'
          }}>
            {children}
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
