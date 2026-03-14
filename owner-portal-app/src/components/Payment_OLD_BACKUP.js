import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Sidebar from './Sidebar';
import './Payment.css';

function Payment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'owner') {
      navigate('/');
      return;
    }

    // Set up real-time listener for payments
    const unsubscribe = setupPaymentsListener();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigate]);

  // Set up Firestore real-time listener for payments
  const setupPaymentsListener = () => {
    try {
      const ownerId = localStorage.getItem('userId');
      
      if (!ownerId) {
        console.error('❌ Owner ID not found');
        setLoading(false);
        return null;
      }

      console.log('💰 Setting up real-time listener for payments, owner:', ownerId);

      // Query payments collection where owner_id matches
      const q = query(
        collection(db, 'payments'),
        where('owner_id', '==', ownerId)
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log(`💰 Real-time update: Found ${snapshot.size} payment(s)`);

          const paymentsData = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('💳 Payment:', {
              id: doc.id,
              booking_id: data.booking_id,
              customer_name: data.customer_name,
              amount: data.amount,
              status: data.payment_status
            });
            return {
              id: doc.id,
              ...data
            };
          });

          setPayments(paymentsData);
          setFilteredPayments(paymentsData);
          setLoading(false);
        },
        (error) => {
          console.error('❌ Error in payments listener:', error);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up payments listener:', error);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(payments.filter(p => p.payment_status === statusFilter));
    }
  }, [statusFilter, payments]);

  const paymentStats = {
    total: payments.length,
    pending: payments.filter(p => p.payment_status === 'pending').length,
    completed: payments.filter(p => p.payment_status === 'completed').length,
    totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    pendingAmount: payments.filter(p => p.payment_status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading">Loading payments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <div className="payment-page">
          <div className="page-header">
            <h1>💰 Payment Management</h1>
            <p>Track all payments from accepted bookings</p>
          </div>

          {/* Payment Stats */}
          <div className="payment-stats">
            <div className="stat-card">
              <div className="stat-icon">💳</div>
              <div className="stat-details">
                <h4>Total Payments</h4>
                <p className="stat-number">{paymentStats.total}</p>
              </div>
            </div>
            <div className="stat-card" style={{borderLeft: '4px solid #ffc107'}}>
              <div className="stat-icon">⏳</div>
              <div className="stat-details">
                <h4>Pending</h4>
                <p className="stat-number">{paymentStats.pending}</p>
                <p className="stat-amount">₹{paymentStats.pendingAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="stat-card" style={{borderLeft: '4px solid #28a745'}}>
              <div className="stat-icon">✅</div>
              <div className="stat-details">
                <h4>Completed</h4>
                <p className="stat-number">{paymentStats.completed}</p>
              </div>
            </div>
            <div className="stat-card" style={{borderLeft: '4px solid #007bff'}}>
              <div className="stat-icon">💵</div>
              <div className="stat-details">
                <h4>Total Amount</h4>
                <p className="stat-amount">₹{paymentStats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button 
              className={statusFilter === 'all' ? 'active' : ''} 
              onClick={() => setStatusFilter('all')}
            >
              All ({paymentStats.total})
            </button>
            <button 
              className={statusFilter === 'pending' ? 'active' : ''} 
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({paymentStats.pending})
            </button>
            <button 
              className={statusFilter === 'completed' ? 'active' : ''} 
              onClick={() => setStatusFilter('completed')}
            >
              Completed ({paymentStats.completed})
            </button>
          </div>

          {/* Payments List */}
          <div className="payments-container">
            {filteredPayments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <h3>No payments found</h3>
                <p>
                  {statusFilter === 'all' 
                    ? 'Payments will appear here when you accept booking requests' 
                    : `No ${statusFilter} payments`}
                </p>
              </div>
            ) : (
              <div className="payments-grid">
                {filteredPayments.map(payment => (
                  <div key={payment.id} className={`payment-card ${payment.payment_status}`}>
                    <div className="payment-header">
                      <div>
                        <h3>💳 {payment.payment_id}</h3>
                        <p className="booking-id">Booking: {payment.booking_id}</p>
                      </div>
                      <span className={`status-badge status-${payment.payment_status}`}>
                        {payment.payment_status === 'pending' ? '⏳ Pending' : '✅ Completed'}
                      </span>
                    </div>

                    <div className="payment-details">
                      <div className="detail-row">
                        <span className="label">👤 Customer:</span>
                        <span className="value">{payment.customer_name || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">🔧 Equipment:</span>
                        <span className="value">{payment.equipment_name || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">📍 Location:</span>
                        <span className="value">{payment.location || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">💰 Amount:</span>
                        <span className="value price">₹{payment.amount?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">💳 Method:</span>
                        <span className="value">{payment.payment_method || 'N/A'}</span>
                      </div>
                      {payment.upi_transaction_id && (
                        <div className="detail-row">
                          <span className="label">🆔 UPI ID:</span>
                          <span className="value" style={{fontSize: '0.85em'}}>{payment.upi_transaction_id}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="label">📅 Created:</span>
                        <span className="value">{formatDate(payment.created_at)}</span>
                      </div>
                      {payment.verified_at && (
                        <div className="detail-row">
                          <span className="label">✅ Verified:</span>
                          <span className="value">{formatDate(payment.verified_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;
      alert('UPI ID updated successfully!');
    } catch (error) {
      console.error('Error updating UPI:', error);
      alert('Failed to update UPI ID');
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    if (!window.confirm('Confirm that you have received this payment?')) {
      return;
    }

    try {
      setRefreshing(true);
      await api.patch(`/payments/${paymentId}/verify`);
      await fetchPaymentData(); // Refresh data
      alert('Payment verified successfully!');
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment');
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
        {pendingPayments.length > 0 && (
          <div className="payment-section">
            <h2>🔔 Pending Verification ({pendingPayments.length})</h2>
            <div className="payments-list">
              {pendingPayments.map((payment) => (
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
              ))}
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
    </div>
  );
}

export default Payment;
