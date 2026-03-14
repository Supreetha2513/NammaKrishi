import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from './Sidebar';
import './Payment.css';

function Payment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [editingUpi, setEditingUpi] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [paymentStats, setPaymentStats] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [equipmentSummary, setEquipmentSummary] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchUserProfile();
    fetchPaymentData();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUpiId(response.data.user.upi_id || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  };

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch payment stats
      const statsResponse = await api.get('/payments/stats');
      setPaymentStats(statsResponse.data.stats);

      // Fetch pending payments
      const pendingResponse = await api.get('/payments/pending');
      setPendingPayments(pendingResponse.data.payments || []);

      // Fetch recent payments (verified_at === true)
      const paymentsResponse = await api.get('/payments?verified=true&limit=10');
      setRecentPayments(paymentsResponse.data.payments || []);

      // Fetch equipment-level payment summary from equipment collection
      const equipmentResponse = await api.get('/payments/equipment-summary');
      setEquipmentSummary(equipmentResponse.data.equipment_summary || []);

    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUpi = async () => {
    if (!newUpiId.trim()) {
      alert('Please enter a valid UPI ID');
      return;
    }

    try {
      await api.put('/auth/profile', { upi_id: newUpiId });
      setUpiId(newUpiId);
      setEditingUpi(false);
      setNewUpiId('');
      showToast('UPI ID updated successfully!');
    } catch (error) {
      console.error('Error updating UPI:', error);
      showToast('Failed to update UPI ID', 'error');
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    try {
      setRefreshing(true);
      await api.patch(`/payments/${paymentId}/verify`);
      await fetchPaymentData();
      showToast('Payment verified successfully!');
    } catch (error) {
      console.error('Error verifying payment:', error);
      showToast('Failed to verify payment', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="payment-page">
        <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
        <div className="main-content">
          <div className="loading">Loading payment data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      
      <div className="main-content">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setShowSidebar(true)}>☰</button>
          <h1>💳 Payment Settings</h1>
        </div>

        {/* UPI Configuration */}
        <div className="payment-section">
          <div className="section-header">
            <h2>📱 UPI Payment Details</h2>
            {upiId && !editingUpi && (
              <button className="btn btn-outline" onClick={() => {
                setEditingUpi(true);
                setNewUpiId(upiId);
              }}>
                Edit UPI ID
              </button>
            )}
          </div>

          <div className="upi-card">
            {upiId && !editingUpi ? (
              <>
                <div className="upi-display">
                  <span className="upi-label">Your UPI ID:</span>
                  <span className="upi-value">{upiId}</span>
                  <span className="status-badge active">✅ Active</span>
                </div>
                <p className="upi-note">
                  Customers will use this UPI ID to make payments for equipment rentals.
                </p>
              </>
            ) : editingUpi ? (
              <div className="upi-edit">
                <label>Enter UPI ID:</label>
                <input
                  type="text"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value)}
                  placeholder="yourname@paytm"
                  className="upi-input"
                />
                <div className="upi-actions">
                  <button className="btn btn-primary" onClick={handleUpdateUpi}>
                    ✓ Save UPI ID
                  </button>
                  <button className="btn btn-secondary" onClick={() => {
                    setEditingUpi(false);
                    setNewUpiId('');
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="upi-setup">
                <p>⚠️ No UPI ID configured. Please add your UPI ID to receive payments.</p>
                <button className="btn btn-primary" onClick={() => setEditingUpi(true)}>
                  + Add UPI ID
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment Statistics */}
        {paymentStats && (
          <div className="payment-section">
            <h2>📊 Payment Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-label">Total Received</div>
                  <div className="stat-value">{formatCurrency(paymentStats.total_received)}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-label">Pending Verification</div>
                  <div className="stat-value">{formatCurrency(paymentStats.total_pending)}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{paymentStats.completed_count}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔔</div>
                <div className="stat-content">
                  <div className="stat-label">Pending</div>
                  <div className="stat-value">{paymentStats.pending_count}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payments (Require Verification) */}
        <div className="payment-section">
          <h2>🔔 Pending Verification ({pendingPayments.filter(p => p.verified_at !== true && p.amount).length})</h2>
          <div className="payments-list">
            {pendingPayments.filter(p => p.verified_at !== true && p.amount).length > 0 ? (
              pendingPayments
                .filter(p => p.verified_at !== true && p.amount)
                .map((payment) => (
                <div key={payment.id} className="payment-card pending">
                  <div className="payment-info">
                    <div className="payment-header">
                      <span className="equipment-name">{payment.equipment_name || 'Equipment'}</span>
                      <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="payment-details">
                      <span>📅 {formatDate(payment.created_at)}</span>
                      {payment.customer_name && <span>👤 {payment.customer_name}</span>}
                      {payment.upi_transaction_id && (
                        <span>🔢 Txn: {payment.upi_transaction_id}</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={() => handleVerifyPayment(payment.id)}
                    disabled={refreshing}
                  >
                    ✓ Verify Payment
                  </button>
                </div>
              ))
            ) : (
              <div className="no-data"><p>No pending payments to verify</p></div>
            )}
          </div>
        </div>

        {/* Equipment Payment Summary */}
        {equipmentSummary.length > 0 && (
          <div className="payment-section">
            <h2>🚜 Equipment Payment Details</h2>
            <div className="transactions-table">
              <table>
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Category</th>
                    <th>Price/Hour</th>
                    <th>Price/Day</th>
                    <th>Paid Bookings</th>
                    <th>Pending</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentSummary.map((item) => (
                    <tr key={item.equipment_id}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{formatCurrency(item.price_per_hour)}</td>
                      <td>{formatCurrency(item.price_per_day)}</td>
                      <td>{item.paid_bookings}</td>
                      <td>{item.pending_payments}</td>
                      <td className="amount">{formatCurrency(item.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="payment-section">
          <h2>📋 Recent Transactions</h2>
          {recentPayments.length > 0 ? (
            <div className="transactions-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Equipment</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.created_at)}</td>
                      <td>{payment.equipment_name || 'N/A'}</td>
                      <td>{payment.customer_name || 'Customer'}</td>
                      <td className="amount">{formatCurrency(payment.amount)}</td>
                      <td>
                        <span className="status-badge completed">✅ Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>No completed transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </div>
  );
}

export default Payment;
