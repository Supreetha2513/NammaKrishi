import React from 'react';
import Sidebar from './Sidebar';
import './Dashboard.css';

function PlaceholderPage({ title, icon, message }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="main-content">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <h1>{title}</h1>
          <div className="user-info">
            <span>{localStorage.getItem('userName')}</span>
          </div>
        </header>

        <div className="content-area">
          <div className="section-card">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>{icon}</div>
              <h2>{title}</h2>
              <p style={{ color: '#666', marginTop: '10px' }}>{message}</p>
              <p style={{ color: '#999', marginTop: '20px', fontSize: '14px' }}>
                ✅ Dashboard feature is complete and tested
              </p>
              <p style={{ color: '#999', fontSize: '14px' }}>
                This feature will be built next
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaceholderPage;
