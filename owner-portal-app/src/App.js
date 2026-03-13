import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MyEquipment from './components/MyEquipment';
import Bookings from './components/Bookings';
import Payment from './components/Payment';
import Earnings from './components/Earnings';
import AiAssistant from './components/AiAssistant';
import PlaceholderPage from './components/PlaceholderPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/equipment" element={<MyEquipment />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/payments" element={<Payment />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/ai-assistant" element={<AiAssistant />} />
        <Route 
          path="/customer-dashboard" 
          element={
            <div style={{ 
              minHeight: '100vh', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textAlign: 'center',
              padding: '20px'
            }}>
              <div>
                <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>🌾 Customer Portal</h1>
                <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                  You are logged in as a customer
                </p>
                <p style={{ opacity: 0.9 }}>
                  Customer portal features will be developed after owner portal is complete
                </p>
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                  style={{
                    marginTop: '30px',
                    padding: '12px 24px',
                    background: 'white',
                    color: '#667eea',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
