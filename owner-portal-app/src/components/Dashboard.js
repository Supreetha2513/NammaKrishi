import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Sidebar from './Sidebar';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'owner') {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, insightsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/insights').catch(() => ({ data: { insights: [] } }))
      ]);

      if (dashboardRes.data.success) {
        setStats(dashboardRes.data.stats);
        setRecentBookings(dashboardRes.data.recentBookings || []);
        setMonthlyRevenue(dashboardRes.data.monthlyRevenue || []);
      }

      if (insightsRes.data.success) {
        setInsights(insightsRes.data.insights || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="main-content">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <h1>Dashboard</h1>
          <div className="user-info">
            <span>{localStorage.getItem('userName')}</span>
          </div>
        </header>

        <div className="content-area">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🚜</div>
              <div className="stat-info">
                <h3>My Equipment</h3>
                <p className="stat-value">{stats?.equipmentCount || 0}</p>
                <span className="stat-label">Total Listings</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>Active Bookings</h3>
                <p className="stat-value">{stats?.activeBookings || 0}</p>
                <span className="stat-label">Pending & Accepted</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>Total Earnings</h3>
                <p className="stat-value">₹{stats?.totalEarnings?.toLocaleString() || 0}</p>
                <span className="stat-label">All Time</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>This Month</h3>
                <p className="stat-value">₹{stats?.monthlyEarnings?.toLocaleString() || 0}</p>
                <span className="stat-label">Revenue</span>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          {monthlyRevenue.length > 0 && (
            <div className="chart-card">
              <h3>Monthly Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#667eea" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Bookings */}
          <div className="section-card">
            <h3>Recent Bookings</h3>
            {recentBookings.length === 0 ? (
              <p className="empty-state">No bookings yet. Start by adding equipment!</p>
            ) : (
              <div className="bookings-list">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-info">
                      <h4>{booking.equipment_name}</h4>
                      <p className="booking-dates">
                        {booking.start_date?.toDate?.()?.toLocaleDateString() || 'N/A'} - 
                        {booking.end_date?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </p>
                      <p className="booking-price">₹{booking.total_price?.toLocaleString()}</p>
                    </div>
                    <div className={`booking-status status-${booking.booking_status}`}>
                      {booking.booking_status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Demand Insights */}
          {insights.length > 0 && (
            <div className="section-card">
              <h3>🔥 Demand Insights</h3>
              <div className="insights-list">
                {insights.map((insight, index) => (
                  <div key={index} className="insight-item">
                    <div className="insight-icon">📈</div>
                    <div className="insight-info">
                      <h4>{insight.equipment_category}</h4>
                      <p>{insight.location} • {insight.request_count} requests</p>
                      <div className="demand-bar">
                        <div 
                          className="demand-fill" 
                          style={{ width: `${Math.min(insight.demand_score * 10, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
