import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Sidebar from './Sidebar';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    equipmentCount: 0,
    activeBookings: 0,
    totalEarnings: 0,
    monthlyEarnings: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [insights, setInsights] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [topEquipment, setTopEquipment] = useState([]);
  const [pendingActions, setPendingActions] = useState({ payments: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'owner') {
      navigate('/');
      return;
    }

    fetchDashboardData();
    
    // Set up real-time listener for payments
    const ownerId = localStorage.getItem('userId');
    if (ownerId) {
      console.log('🔄 Setting up real-time payments listener for owner:', ownerId);
      
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('owner_id', '==', ownerId)
      );

      const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
        console.log(`💰 Payments update: ${snapshot.size} payments found`);
        
        const payments = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          };
        });

        console.log('📊 Payments data:', payments);

        // Calculate total earnings
        const totalEarnings = payments.reduce((sum, payment) => {
          const amount = Number(payment.amount) || 0;
          console.log(`Adding payment: ${payment.id}, amount: ${amount}`);
          return sum + amount;
        }, 0);

        // Calculate monthly earnings (current month)
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyEarnings = payments.reduce((sum, payment) => {
          const paymentDate = payment.created_at?.toDate ? payment.created_at.toDate() : new Date(payment.created_at);
          if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
            const amount = Number(payment.amount) || 0;
            return sum + amount;
          }
          return sum;
        }, 0);

        console.log('✅ Calculated earnings - Total:', totalEarnings, 'Monthly:', monthlyEarnings);

        // Update stats with real-time earnings
        setStats(prev => ({
          ...prev,
          totalEarnings,
          monthlyEarnings
        }));

        // Calculate payment stats
        const completedPayments = payments.filter(p => p.payment_status === 'completed');
        const pendingPayments = payments.filter(p => p.payment_status === 'pending');
        
        setPaymentStats({
          total_received: completedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
          completed_count: completedPayments.length,
          total_pending: pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
          pending_count: pendingPayments.length
        });
      });

      return () => unsubscribe();
    }
  }, [navigate, location]); // Refresh when location changes (user navigates back)

  // Auto-refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.topbar-right')) {
        setShowNotificationDropdown(false);
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, insightsRes, paymentRes, earningsRes, profileRes, notifRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/insights').catch(() => ({ data: { insights: [] } })),
        api.get('/payments/stats').catch(() => ({ data: { stats: null } })),
        api.get('/earnings/by-equipment').catch(() => ({ data: { equipment_earnings: [] } })),
        api.get('/auth/me').catch(() => ({ data: { user: null } })),
        api.get('/notifications').catch(() => ({ data: { notifications: [], unread_count: 0 } }))
      ]);

      if (dashboardRes.data.success) {
        setStats(prev => ({
          ...prev,
          equipmentCount: dashboardRes.data.stats?.equipmentCount || 0,
          activeBookings: dashboardRes.data.stats?.activeBookings || 0,
          // Keep earnings from real-time listener
          totalEarnings: prev.totalEarnings,
          monthlyEarnings: prev.monthlyEarnings
        }));
        setRecentBookings(dashboardRes.data.recentBookings || []);
        setMonthlyRevenue(dashboardRes.data.monthlyRevenue || []);
      }

      if (insightsRes.data.success) {
        setInsights(insightsRes.data.insights || []);
      }

      if (paymentRes.data.stats) {
        setPaymentStats(paymentRes.data.stats);
        setPendingActions(prev => ({ ...prev, payments: paymentRes.data.stats.pending_count || 0 }));
      }

      if (earningsRes.data.equipment_earnings) {
        const topItems = earningsRes.data.equipment_earnings.slice(0, 3);
        setTopEquipment(topItems);
      }

      if (profileRes.data.user) {
        setOwnerProfile(profileRes.data.user);
      }

      if (notifRes.data.notifications) {
        setNotifications(notifRes.data.notifications);
        setUnreadCount(notifRes.data.unread_count || 0);
      }

      // Get pending bookings count
      try {
        const bookingsRes = await api.get('/bookings');
        const pendingBookings = bookingsRes.data.bookings?.filter(b => b.status === 'pending').length || 0;
        setPendingActions(prev => ({ ...prev, bookings: pendingBookings }));
      } catch (err) {
        console.log('Bookings error:', err);
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
          <div className="topbar-right">
            <button 
              className="notification-bell" 
              onClick={() => {
                setShowNotificationDropdown(!showNotificationDropdown);
                setShowProfileDropdown(false);
              }}
            >
              🔔
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            <div 
              className="user-info" 
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotificationDropdown(false);
              }}
            >
              <div className="user-avatar">{ownerProfile?.name?.charAt(0) || 'U'}</div>
              <span className="user-name">{ownerProfile?.name || localStorage.getItem('userName')}</span>
              <span className="dropdown-arrow">▼</span>
            </div>

            {/* Notification Dropdown */}
            {showNotificationDropdown && (
              <div className="notification-dropdown">
                <div className="notifications-section">
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button 
                        className="mark-all-read"
                        onClick={async () => {
                          try {
                            await api.patch('/notifications/mark-all-read');
                            setNotifications(notifications.map(n => ({ ...n, status: 'read' })));
                            setUnreadCount(0);
                          } catch (err) {
                            console.error('Error marking all as read:', err);
                          }
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <p className="no-notifications">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`notification-item ${notif.status === 'unread' ? 'unread' : ''}`}
                          onClick={async () => {
                            if (notif.status === 'unread') {
                              try {
                                await api.patch(`/notifications/${notif.id}/read`);
                                setNotifications(notifications.map(n => 
                                  n.id === notif.id ? { ...n, status: 'read' } : n
                                ));
                                setUnreadCount(prev => Math.max(0, prev - 1));
                              } catch (err) {
                                console.error('Error marking as read:', err);
                              }
                            }
                          }}
                        >
                          <div className="notif-icon">
                            {notif.notification_type === 'booking_request' && '📅'}
                            {notif.notification_type === 'payment_received' && '💰'}
                            {notif.notification_type === 'maintenance_due' && '🔧'}
                            {notif.notification_type === 'pricing_update' && '📊'}
                            {notif.notification_type === 'demand_alert' && '🔥'}
                            {!['booking_request', 'payment_received', 'maintenance_due', 'pricing_update', 'demand_alert'].includes(notif.notification_type) && '📢'}
                          </div>
                          <div className="notif-content">
                            <h5>{notif.title}</h5>
                            <p>{notif.message}</p>
                            <span className="notif-time">
                              {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                            </span>
                          </div>
                          {notif.status === 'unread' && <div className="unread-dot"></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="profile-section">
                  <div className="profile-header">
                    <div className="profile-avatar-large">{ownerProfile?.name?.charAt(0) || 'U'}</div>
                    <div className="profile-details">
                      <h3>{ownerProfile?.name || 'Owner'}</h3>
                      <p className="profile-email">{ownerProfile?.email || ''}</p>
                    </div>
                  </div>
                  <div className="profile-info-grid">
                    <div className="profile-info-item">
                      <span className="info-label">📱 Phone</span>
                      <span className="info-value">{ownerProfile?.phone || 'Not set'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">💳 UPI ID</span>
                      <span className="info-value">{ownerProfile?.upi_id || 'Not set'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">🌐 Language</span>
                      <span className="info-value">{ownerProfile?.language_preference || 'en'}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-actions">
                  <button className="profile-action-btn logout-btn" onClick={() => {
                    localStorage.clear();
                    navigate('/');
                  }}>🚪 Logout</button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="content-area">

          {/* Quick Actions */}
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate('/equipment')}>
              <span className="action-icon">➕</span>
              <span>Add Equipment</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/payments')}>
              <span className="action-icon">💳</span>
              <span>Manage Payments</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/earnings')}>
              <span className="action-icon">📊</span>
              <span>View Earnings</span>
            </button>
            <button className="quick-action-btn" onClick={() => fetchDashboardData()}>
              <span className="action-icon">🔄</span>
              <span>Refresh Data</span>
            </button>
          </div>

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

            {/* Payment Stats Cards */}
            {paymentStats && (
              <>
                <div className="stat-card payment-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>Payments Received</h3>
                    <p className="stat-value">₹{paymentStats.total_received?.toLocaleString() || 0}</p>
                    <span className="stat-label">{paymentStats.completed_count || 0} completed</span>
                  </div>
                </div>

                <div className="stat-card pending-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <h3>Pending Verification</h3>
                    <p className="stat-value">₹{paymentStats.total_pending?.toLocaleString() || 0}</p>
                    <span className="stat-label">{paymentStats.pending_count || 0} pending</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Top Performing Equipment */}
          {topEquipment.length > 0 && (
            <div className="section-card top-equipment-card">
              <h3>🏆 Top Performing Equipment</h3>
              <div className="top-equipment-list">
                {topEquipment.map((item, index) => (
                  <div key={item.equipment_id} className="top-equipment-item">
                    <div className="equipment-rank">#{index + 1}</div>
                    <div className="equipment-details">
                      <h4>{item.equipment_name}</h4>
                      <p>{item.bookings} bookings</p>
                    </div>
                    <div className="equipment-earnings">
                      ₹{item.earnings.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    <div className={`booking-status status-${booking.status}`}>
                      {booking.status}
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
