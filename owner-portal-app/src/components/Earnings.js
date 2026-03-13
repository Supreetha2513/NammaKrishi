import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import Sidebar from './Sidebar';
import './Earnings.css';

function Earnings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [equipmentEarnings, setEquipmentEarnings] = useState([]);
  const [chartView, setChartView] = useState('line'); // line or bar

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);

      // Fetch summary
      const summaryResponse = await api.get('/earnings/summary');
      setSummary(summaryResponse.data.summary);

      // Fetch monthly breakdown
      const monthlyResponse = await api.get('/earnings/monthly?months=6');
      const monthly = monthlyResponse.data.monthly_earnings || [];
      
      // Format for charts (reverse to show oldest first)
      const formattedMonthly = monthly.reverse().map(item => ({
        month: formatMonth(item.month),
        earnings: item.total_earnings,
        bookings: item.total_bookings
      }));
      setMonthlyData(formattedMonthly);

      // Fetch equipment earnings
      const equipmentResponse = await api.get('/earnings/by-equipment');
      setEquipmentEarnings(equipmentResponse.data.equipment_earnings || []);

    } catch (error) {
      console.error('Error fetching earnings:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="earnings-page">
        <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
        <div className="main-content">
          <div className="loading">Loading earnings data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="earnings-page">
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      
      <div className="main-content">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setShowSidebar(true)}>☰</button>
          <h1>💸 Earnings Dashboard</h1>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="earnings-section">
            <h2>📈 Overview</h2>
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-label">Total Earnings</div>
                  <div className="stat-value">{formatCurrency(summary.total_earnings)}</div>
                </div>
              </div>
              <div className="stat-card month">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-label">This Month</div>
                  <div className="stat-value">{formatCurrency(summary.current_month_earnings)}</div>
                </div>
              </div>
              <div className="stat-card pending">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-label">Pending Amount</div>
                  <div className="stat-value">{formatCurrency(summary.total_pending)}</div>
                </div>
              </div>
              <div className="stat-card paid">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-label">Paid Out</div>
                  <div className="stat-value">{formatCurrency(summary.total_paid)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Chart */}
        {monthlyData.length > 0 && (
          <div className="earnings-section">
            <div className="section-header">
              <h2>📊 Revenue Trend (Last 6 Months)</h2>
              <div className="chart-controls">
                <button
                  className={`chart-btn ${chartView === 'line' ? 'active' : ''}`}
                  onClick={() => setChartView('line')}
                >
                  📈 Line
                </button>
                <button
                  className={`chart-btn ${chartView === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartView('bar')}
                >
                  📊 Bar
                </button>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                {chartView === 'line' ? (
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#667eea" 
                      strokeWidth={3}
                      name="Earnings (₹)"
                    />
                  </LineChart>
                ) : (
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="earnings" fill="#667eea" name="Earnings (₹)" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Earnings by Equipment */}
        {equipmentEarnings.length > 0 && (
          <div className="earnings-section">
            <h2>🚜 Earnings by Equipment</h2>
            <div className="equipment-earnings-list">
              {equipmentEarnings.map((item, index) => {
                const percentage = summary ? (item.earnings / summary.total_earnings * 100).toFixed(1) : 0;
                return (
                  <div key={item.equipment_id} className="equipment-earning-card">
                    <div className="equipment-rank">#{index + 1}</div>
                    <div className="equipment-info">
                      <h3>{item.equipment_name}</h3>
                      <div className="equipment-stats">
                        <span className="bookings-count">📦 {item.bookings} bookings</span>
                        <span className="percentage">{percentage}% of total</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="equipment-earnings">
                      {formatCurrency(item.earnings)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Monthly Breakdown Table */}
        {monthlyData.length > 0 && (
          <div className="earnings-section">
            <h2>📅 Monthly Breakdown</h2>
            <div className="monthly-table">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Bookings</th>
                    <th>Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.slice().reverse().map((item, index) => (
                    <tr key={index}>
                      <td>{item.month}</td>
                      <td>{item.bookings}</td>
                      <td className="amount">{formatCurrency(item.earnings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data State */}
        {summary && summary.total_earnings === 0 && (
          <div className="earnings-section">
            <div className="no-data">
              <div className="no-data-icon">📊</div>
              <h3>No Earnings Yet</h3>
              <p>Start earning by renting out your equipment!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Earnings;
