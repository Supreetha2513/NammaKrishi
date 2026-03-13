import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import api from '../services/api';
import Sidebar from './Sidebar';
import './Bookings.css';

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'owner') {
      navigate('/');
      return;
    }

    setupRealtimeListener();
  }, [navigate]);

  // Real-time Firestore listener
  const setupRealtimeListener = () => {
    const ownerId = localStorage.getItem('userId');
    
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('owner_id', '==', ownerId),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
      const bookingsData = [];
      
      for (const doc of snapshot.docs) {
        const bookingData = { id: doc.id, ...doc.data() };
        
        // Fetch equipment details
        try {
          const equipmentResponse = await api.get(`/equipment/${bookingData.equipment_id}`);
          bookingData.equipment = equipmentResponse.data.equipment;
        } catch (error) {
          console.error('Error fetching equipment:', error);
          bookingData.equipment = { name: 'Unknown Equipment' };
        }
        
        // Format customer data (already in booking if available)
        if (!bookingData.customer && bookingData.customer_id) {
          bookingData.customer = { 
            name: 'Customer',
            email: bookingData.customer_email || 'N/A' 
          };
        }
        
        bookingsData.push(bookingData);
      }
      
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to bookings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.booking_status === statusFilter));
    }
  }, [statusFilter, bookings]);

  const handleAcceptBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      const response = await api.post(`/bookings/${bookingId}/accept`);
      if (response.data.success) {
        alert('Booking accepted successfully!');
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert(error.response?.data?.message || 'Failed to accept booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      const response = await api.post(`/bookings/${bookingId}/reject`, {
        rejection_reason: rejectionReason
      });
      if (response.data.success) {
        alert('Booking rejected');
        setShowModal(false);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Failed to reject booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (!window.confirm('Mark this booking as completed?')) return;
    
    setActionLoading(true);
    try {
      const response = await api.post(`/bookings/${bookingId}/complete`);
      if (response.data.success) {
        alert('Booking marked as completed!');
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Failed to complete booking');
    } finally {
      setActionLoading(false);
    }
  };

  const openBookingModal = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-pending', text: 'Pending' },
      accepted: { class: 'status-accepted', text: 'Accepted' },
      rejected: { class: 'status-rejected', text: 'Rejected' },
      completed: { class: 'status-completed', text: 'Completed' }
    };
    return badges[status] || { class: '', text: status };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '0 days';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.booking_status === 'pending').length,
    accepted: bookings.filter(b => b.booking_status === 'accepted').length,
    completed: bookings.filter(b => b.booking_status === 'completed').length
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading">Loading bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <div className="bookings-page">
          <div className="page-header">
            <div>
              <h1>📅 Bookings Management</h1>
              <p>Manage all your equipment booking requests and schedules</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="booking-stats">
            <div className="stat-card-small">
              <div className="stat-icon">📋</div>
              <div className="stat-details">
                <h4>Total Bookings</h4>
                <p className="stat-number">{stats.total}</p>
              </div>
            </div>
            <div className="stat-card-small pending-highlight">
              <div className="stat-icon">⏰</div>
              <div className="stat-details">
                <h4>Pending Requests</h4>
                <p className="stat-number">{stats.pending}</p>
              </div>
            </div>
            <div className="stat-card-small accepted-highlight">
              <div className="stat-icon">✅</div>
              <div className="stat-details">
                <h4>Accepted</h4>
                <p className="stat-number">{stats.accepted}</p>
              </div>
            </div>
            <div className="stat-card-small completed-highlight">
              <div className="stat-icon">🎉</div>
              <div className="stat-details">
                <h4>Completed</h4>
                <p className="stat-number">{stats.completed}</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button 
              className={statusFilter === 'all' ? 'active' : ''} 
              onClick={() => setStatusFilter('all')}
            >
              All ({stats.total})
            </button>
            <button 
              className={statusFilter === 'pending' ? 'active' : ''} 
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({stats.pending})
            </button>
            <button 
              className={statusFilter === 'accepted' ? 'active' : ''} 
              onClick={() => setStatusFilter('accepted')}
            >
              Accepted ({stats.accepted})
            </button>
            <button 
              className={statusFilter === 'completed' ? 'active' : ''} 
              onClick={() => setStatusFilter('completed')}
            >
              Completed ({stats.completed})
            </button>
            <button 
              className={statusFilter === 'rejected' ? 'active' : ''} 
              onClick={() => setStatusFilter('rejected')}
            >
              Rejected
            </button>
          </div>

          {/* Bookings List */}
          <div className="bookings-container">
            {filteredBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No bookings found</h3>
                <p>
                  {statusFilter === 'all' 
                    ? 'You haven\'t received any booking requests yet' 
                    : `No ${statusFilter} bookings`}
                </p>
              </div>
            ) : (
              <div className="bookings-grid">
                {filteredBookings.map(booking => (
                  <div 
                    key={booking.id} 
                    className={`booking-card ${booking.booking_status}`}
                    onClick={() => openBookingModal(booking)}
                  >
                    <div className="booking-card-header">
                      <div className="equipment-info">
                        <h3>{booking.equipment?.name || 'Equipment'}</h3>
                        <p className="equipment-type">{booking.equipment?.category || 'N/A'}</p>
                      </div>
                      <span className={`status-badge ${getStatusBadge(booking.booking_status).class}`}>
                        {getStatusBadge(booking.booking_status).text}
                      </span>
                    </div>

                    <div className="booking-details">
                      <div className="detail-row">
                        <span className="label">👤 Customer:</span>
                        <span className="value">{booking.customer?.name || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">📅 Dates:</span>
                        <span className="value">
                          {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">⏱️ Duration:</span>
                        <span className="value">{calculateDuration(booking.start_date, booking.end_date)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">💰 Total:</span>
                        <span className="value price">₹{booking.total_price?.toLocaleString() || 'N/A'}</span>
                      </div>
                    </div>

                    {booking.booking_status === 'pending' && (
                      <div className="booking-actions">
                        <button 
                          className="btn-accept"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptBooking(booking.id);
                          }}
                          disabled={actionLoading}
                        >
                          ✓ Accept
                        </button>
                        <button 
                          className="btn-reject"
                          onClick={(e) => {
                            e.stopPropagation();
                            openBookingModal(booking);
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}

                    {booking.booking_status === 'accepted' && (
                      <div className="booking-actions">
                        <button 
                          className="btn-complete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteBooking(booking.id);
                          }}
                          disabled={actionLoading}
                        >
                          ✓ Mark Completed
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {showModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-section">
                <h3>Equipment</h3>
                <p className="equipment-name">{selectedBooking.equipment?.name}</p>
                <p className="equipment-category">{selectedBooking.equipment?.category}</p>
              </div>

              <div className="modal-section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {selectedBooking.customer?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedBooking.customer?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedBooking.customer?.phone || 'N/A'}</p>
              </div>

              <div className="modal-section">
                <h3>Booking Details</h3>
                <p><strong>Start Date:</strong> {formatDate(selectedBooking.start_date)}</p>
                <p><strong>End Date:</strong> {formatDate(selectedBooking.end_date)}</p>
                <p><strong>Duration:</strong> {calculateDuration(selectedBooking.start_date, selectedBooking.end_date)}</p>
                <p><strong>Total Price:</strong> ₹{selectedBooking.total_price?.toLocaleString()}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${getStatusBadge(selectedBooking.booking_status).class}`}>
                  {getStatusBadge(selectedBooking.booking_status).text}
                </span></p>
              </div>

              {selectedBooking.booking_status === 'pending' && (
                <div className="modal-section">
                  <h3>Reject Booking</h3>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Optional: Provide a reason for rejection..."
                    rows="3"
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedBooking.booking_status === 'pending' && (
                <>
                  <button 
                    className="btn-accept-large"
                    onClick={() => handleAcceptBooking(selectedBooking.id)}
                    disabled={actionLoading}
                  >
                    ✓ Accept Booking
                  </button>
                  <button 
                    className="btn-reject-large"
                    onClick={() => handleRejectBooking(selectedBooking.id)}
                    disabled={actionLoading}
                  >
                    ✗ Reject Booking
                  </button>
                </>
              )}
              {selectedBooking.booking_status === 'accepted' && (
                <button 
                  className="btn-complete-large"
                  onClick={() => handleCompleteBooking(selectedBooking.id)}
                  disabled={actionLoading}
                >
                  ✓ Mark as Completed
                </button>
              )}
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bookings;
