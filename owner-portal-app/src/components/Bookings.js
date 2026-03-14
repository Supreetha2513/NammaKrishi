import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
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
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [ownerUpiId, setOwnerUpiId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'owner') {
      navigate('/');
      return;
    }

    fetchOwnerDetails();
    fetchBookings();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchBookings, 5000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  // Fetch owner's UPI ID from owners collection
  const fetchOwnerDetails = async () => {
    try {
      const ownerId = localStorage.getItem('userId');
      if (!ownerId) return;

      const ownerDoc = await getDoc(doc(db, 'owners', ownerId));
      if (ownerDoc.exists()) {
        const ownerData = ownerDoc.data();
        setOwnerUpiId(ownerData.upi_id || '');
      }
    } catch (error) {
      console.error('Error fetching owner details:', error);
    }
  };

  // Fetch bookings directly from Firestore
  const fetchBookings = async () => {
    try {
      const ownerId = localStorage.getItem('userId'); // Get logged-in owner's Firebase UID
      
      if (!ownerId) {
        console.error('❌ Owner ID not found in localStorage');
        console.log('💡 Please make sure you are logged in as an owner');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching equipment requests for owner:', ownerId);

      // Query equipment_requests collection where owner_id matches current owner
      const q = query(
        collection(db, 'equipment_requests'),
        where('owner_id', '==', ownerId)
      );

      const snapshot = await getDocs(q);
      
      console.log(`📊 Found ${snapshot.size} equipment request(s)`);

      // Extract ALL fields from each document
      const requests = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Request:', {
          id: doc.id,
          customer_name: data.customer_name,
          equipment_name: data.equipment_name,
          status: data.request_status,
          ...data
        });
        return {
          id: doc.id,
          ...data
        };
      });

      setBookings(requests);
      setFilteredBookings(requests);
      setLoading(false);
      
      if (requests.length === 0) {
        console.log('💡 No equipment requests found for this owner');
        console.log('💡 Make sure customer portal is creating requests with owner_id:', ownerId);
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      console.error('Error details:', error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredBookings(bookings);
    } else if (statusFilter === 'pending') {
      // Show both 'pending' and 'open' status when filtering by pending
      setFilteredBookings(bookings.filter(b => 
        b.request_status === 'pending' || b.request_status === 'open'
      ));
    } else {
      setFilteredBookings(bookings.filter(b => b.request_status === statusFilter));
    }
  }, [statusFilter, bookings]);

  const handleAcceptBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      const booking = bookings.find(b => b.id === bookingId);
      
      if (!booking) {
        alert('Booking not found');
        return;
      }

      // Check if required payment details exist
      if (!booking.total_price) {
        alert('❌ Payment details missing. Cannot accept booking without total price.');
        setActionLoading(false);
        return;
      }

      // Generate payment ID and transaction ID
      const now = new Date();
      const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const paymentId = `PAY_${yearMonth}_${randomNum}`;
      const upiTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Create payment document
      const paymentData = {
        amount: booking.total_price,
        booking_id: booking.id,
        created_at: Timestamp.now(),
        customer_id: booking.customer_id || '',
        customer_name: booking.customer_name || '',
        equipment_id: booking.equipment_id || '',
        equipment_name: booking.equipment_name || '',
        owner_id: booking.owner_id || '',
        payment_id: paymentId,
        payment_method: 'UPI',
        payment_screenshot_url: null,
        payment_status: 'completed',
        upi_transaction_id: upiTransactionId,
        verified_at: Timestamp.now(),
        owner_upi_id: ownerUpiId || ''
      };

      // Add payment to Firestore
      const paymentDocRef = await addDoc(collection(db, 'payments'), paymentData);
      
      // Update request_status in equipment_requests to "accepted"
      const requestRef = doc(db, 'equipment_requests', bookingId);
      await updateDoc(requestRef, {
        request_status: 'accepted',
        payment_id: paymentId
      });

      // Create a new document in the bookings collection
      await addDoc(collection(db, 'bookings'), {
        equipment_id: booking.equipment_id,
        owner_id: booking.owner_id,
        customer_id: booking.customer_id,
        customer_name: booking.customer_name || '',
        equipment_name: booking.equipment_name || '',
        location: booking.location || '',
        start_date: booking.start_date,
        end_date: booking.end_date,
        booking_status: 'accepted',
        payment_status: 'completed',
        payment_id: paymentId,
        created_at: Timestamp.now()
      });

      // Set payment details to display in modal
      setPaymentDetails({
        ...paymentData,
        id: paymentDocRef.id,
        created_at: now,
        verified_at: now
      });

      alert('✅ Booking accepted successfully! Payment recorded.');
      fetchBookings(); // Refresh data
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert('Failed to accept booking: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      // Update request_status in equipment_requests to "rejected"
      const requestRef = doc(db, 'equipment_requests', bookingId);
      await updateDoc(requestRef, {
        request_status: 'rejected',
        rejection_reason: rejectionReason || 'Not specified'
      });

      alert('❌ Booking rejected');
      setShowModal(false);
      setRejectionReason('');
      fetchBookings(); // Refresh data
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Failed to reject booking: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (!window.confirm('Mark this booking as completed?')) return;
    
    setActionLoading(true);
    try {
      const requestRef = doc(db, 'equipment_requests', bookingId);
      await updateDoc(requestRef, {
        request_status: 'completed'
      });

      alert('🎉 Booking marked as completed!');
      fetchBookings(); // Refresh data
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Failed to complete booking');
    } finally {
      setActionLoading(false);
    }
  };

  const openBookingModal = (booking) => {
    setSelectedBooking(booking);
    setPaymentDetails(null); // Reset payment details
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-pending', text: 'Pending' },
      accepted: { class: 'status-accepted', text: 'Accepted' },
      rejected: { class: 'status-rejected', text: 'Rejected' },
      completed: { class: 'status-completed', text: 'Completed' },
      open: { class: 'status-pending', text: 'Open' } // Map "open" to pending style
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
    pending: bookings.filter(b => b.request_status === 'pending' || b.request_status === 'open').length,
    accepted: bookings.filter(b => b.request_status === 'accepted').length,
    completed: bookings.filter(b => b.request_status === 'completed').length
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
                    className={`booking-card ${booking.request_status}`}
                    onClick={() => openBookingModal(booking)}
                  >
                    <div className="booking-card-header">
                      <div className="equipment-info">
                        <h3>{booking.equipment_name || 'Equipment'}</h3>
                        <p className="equipment-type">📍 {booking.location || 'N/A'}</p>
                      </div>
                      <span className={`status-badge ${getStatusBadge(booking.request_status).class}`}>
                        {getStatusBadge(booking.request_status).text}
                      </span>
                    </div>

                    <div className="booking-details">
                      <div className="detail-row">
                        <span className="label">👤 Customer:</span>
                        <span className="value">{booking.customer_name || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">🆔 Customer ID:</span>
                        <span className="value" style={{fontSize: '0.85em', opacity: 0.8}}>{booking.customer_id || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">🔧 Equipment ID:</span>
                        <span className="value" style={{fontSize: '0.85em', opacity: 0.8}}>{booking.equipment_id || 'N/A'}</span>
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

                    {(booking.request_status === 'pending' || booking.request_status === 'open') && (
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

                    {booking.request_status === 'accepted' && (
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
                <h3>📍 Equipment Details</h3>
                <p className="equipment-name">{selectedBooking.equipment_name || 'N/A'}</p>
                <p><strong>Equipment ID:</strong> {selectedBooking.equipment_id || 'N/A'}</p>
                <p><strong>Location:</strong> 📍 {selectedBooking.location || 'N/A'}</p>
              </div>

              <div className="modal-section">
                <h3>👤 Customer Information</h3>
                <p><strong>Name:</strong> {selectedBooking.customer_name || 'N/A'}</p>
                <p><strong>Customer ID:</strong> {selectedBooking.customer_id || 'N/A'}</p>
              </div>

              <div className="modal-section">
                <h3>📅 Rental Details</h3>
                <p><strong>Start Date:</strong> {formatDate(selectedBooking.start_date)}</p>
                <p><strong>End Date:</strong> {formatDate(selectedBooking.end_date)}</p>
                <p><strong>Duration:</strong> {calculateDuration(selectedBooking.start_date, selectedBooking.end_date)}</p>
                <p><strong>Total Price:</strong> ₹{selectedBooking.total_price?.toLocaleString() || 'N/A'}</p>
              </div>

              <div className="modal-section">
                <h3>ℹ️ Request Information</h3>
                <p><strong>Request ID:</strong> {selectedBooking.id || 'N/A'}</p>
                <p><strong>Owner ID:</strong> {selectedBooking.owner_id || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${getStatusBadge(selectedBooking.request_status).class}`}>
                  {getStatusBadge(selectedBooking.request_status).text}
                </span></p>
                {selectedBooking.created_at && (
                  <p><strong>Created:</strong> {formatDate(selectedBooking.created_at.toDate ? selectedBooking.created_at.toDate() : selectedBooking.created_at)}</p>
                )}
                {selectedBooking.rejection_reason && (
                  <p><strong>Rejection Reason:</strong> {selectedBooking.rejection_reason}</p>
                )}
              </div>

              {paymentDetails && (
                <div className="modal-section payment-details-section">
                  <h3>💳 Payment Details</h3>
                  <div className="payment-success-banner">
                    <span className="success-icon">✅</span>
                    <span>Payment Created Successfully!</span>
                  </div>
                  <p><strong>Payment ID:</strong> {paymentDetails.payment_id}</p>
                  <p><strong>Transaction ID:</strong> {paymentDetails.upi_transaction_id}</p>
                  <p><strong>Amount:</strong> ₹{paymentDetails.amount?.toLocaleString()}</p>
                  <p><strong>Payment Method:</strong> {paymentDetails.payment_method}</p>
                  <p><strong>Payment Status:</strong> <span className="status-badge status-completed">{paymentDetails.payment_status}</span></p>
                  <p><strong>Customer:</strong> {paymentDetails.customer_name}</p>
                  <p><strong>Equipment:</strong> {paymentDetails.equipment_name}</p>
                  {ownerUpiId && <p><strong>Owner UPI ID:</strong> {ownerUpiId}</p>}
                  <p><strong>Created At:</strong> {paymentDetails.created_at?.toLocaleString?.() || new Date(paymentDetails.created_at).toLocaleString()}</p>
                  <p><strong>Verified At:</strong> {paymentDetails.verified_at?.toLocaleString?.() || new Date(paymentDetails.verified_at).toLocaleString()}</p>
                </div>
              )}

              {(selectedBooking.request_status === 'pending' || selectedBooking.request_status === 'open') && (
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
              {(selectedBooking.request_status === 'pending' || selectedBooking.request_status === 'open') && (
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
              {selectedBooking.status === 'accepted' && (
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
