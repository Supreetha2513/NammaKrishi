import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, updateDoc, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
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
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'owner') {
      navigate('/');
      return;
    }

    fetchOwnerDetails();
    
    // Set up real-time listener for bookings
    const ownerId = localStorage.getItem('userId');
    if (!ownerId) {
      console.error('❌ Owner ID not found in localStorage');
      setLoading(false);
      return;
    }

    console.log('🔍 Setting up real-time listener for owner:', ownerId);

    // Query equipment_requests collection where owner_id matches current owner
    const q = query(
      collection(db, 'equipment_requests'),
      where('owner_id', '==', ownerId)
    );

    // Set up real-time listener with onSnapshot
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log(`📊 Real-time update: Found ${snapshot.size} equipment request(s)`);

      // Extract ALL fields from each document and convert Timestamps
      const requests = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        // Convert Firestore Timestamps to JavaScript Dates
        const startDate = data.start_date?.toDate ? data.start_date.toDate() : data.start_date;
        const endDate = data.end_date?.toDate ? data.end_date.toDate() : data.end_date;
        const createdAt = data.created_at?.toDate ? data.created_at.toDate() : data.created_at;

        // Fetch price_per_day from equipment collection to calculate total amount
        let pricePerDay = 0;
        let calculatedTotal = null;
        if (data.equipment_id) {
          try {
            const equipSnap = await getDoc(doc(db, 'equipment', data.equipment_id));
            if (equipSnap.exists()) {
              pricePerDay = equipSnap.data().price_per_day || 0;
            }
          } catch (err) {
            console.log('Could not fetch equipment price:', err.message);
          }
        }
        if (pricePerDay > 0 && startDate && endDate) {
          const msPerDay = 1000 * 60 * 60 * 24;
          const numDays = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / msPerDay));
          calculatedTotal = numDays * pricePerDay;
        }

        console.log('📄 Request:', {
          id: docSnap.id,
          customer_name: data.customer_name,
          equipment_name: data.equipment_name,
          booking_status: data.booking_status,
          start_date: startDate,
          end_date: endDate
        });
        
        return {
          id: docSnap.id,
          ...data,
          start_date: startDate,
          end_date: endDate,
          created_at: createdAt,
          price_per_day: pricePerDay,
          calculated_total: calculatedTotal
        };
      }));

      setBookings(requests);
      setLoading(false);
      
      if (requests.length === 0) {
        console.log('💡 No equipment requests found for this owner');
      }
    }, (error) => {
      console.error('❌ Error in real-time listener:', error);
      setLoading(false);
    });
    
    // Cleanup listener on unmount
    return () => unsubscribe();
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

  // Filter bookings based on selected status
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredBookings(bookings);
    } else if (statusFilter === 'pending') {
      // Show both 'pending' and 'open' status when filtering by pending
      setFilteredBookings(bookings.filter(b => 
        b.booking_status === 'pending' || b.booking_status === 'open'
      ));
    } else {
      setFilteredBookings(bookings.filter(b => b.booking_status === statusFilter));
    }
  }, [statusFilter, bookings]);

  const handleAcceptBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      const booking = bookings.find(b => b.id === bookingId);
      
      if (!booking) {
        showToast('Booking not found.', 'error');
        setActionLoading(false);
        return;
      }

      // Fetch equipment to get price_per_day
      let pricePerDay = 0;
      if (booking.equipment_id) {
        const equipSnap = await getDoc(doc(db, 'equipment', booking.equipment_id));
        if (equipSnap.exists()) {
          pricePerDay = equipSnap.data().price_per_day || 0;
        }
      }

      // Calculate number of days from start_date and end_date
      const startDate = booking.start_date instanceof Date ? booking.start_date : new Date(booking.start_date);
      const endDate = booking.end_date instanceof Date ? booking.end_date : new Date(booking.end_date);
      const msPerDay = 1000 * 60 * 60 * 24;
      const numDays = Math.max(1, Math.round((endDate - startDate) / msPerDay));

      // Calculate amount: days × price_per_day
      const calculatedAmount = numDays * pricePerDay;

      const now = new Date();

      // Create payment document with payment_id null and status incomplete
      const paymentData = {
        amount: calculatedAmount,
        num_days: numDays,
        price_per_day: pricePerDay,
        booking_id: booking.id,
        created_at: Timestamp.now(),
        customer_id: booking.customer_id || '',
        customer_name: booking.customer_name || '',
        equipment_id: booking.equipment_id || '',
        equipment_name: booking.equipment_name || '',
        owner_id: booking.owner_id || '',
        payment_id: null,
        payment_method: 'UPI',
        payment_screenshot_url: null,
        payment_status: 'incomplete',
        upi_transaction_id: null,
        verified_at: false,
        owner_upi_id: ownerUpiId || ''
      };

      // Add payment to Firestore
      const paymentDocRef = await addDoc(collection(db, 'payments'), paymentData);
      console.log('✅ Payment created:', paymentDocRef.id);

      // Update booking_status in equipment_requests to "accepted"
      const requestRef = doc(db, 'equipment_requests', bookingId);
      await updateDoc(requestRef, {
        booking_status: 'accepted',
        payment_id: null,
        accepted_at: Timestamp.now()
      });
      console.log('✅ Booking status updated to accepted');

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
        num_days: numDays,
        price_per_day: pricePerDay,
        total_price: calculatedAmount,
        booking_status: 'accepted',
        payment_status: 'incomplete',
        payment_id: null,
        created_at: Timestamp.now()
      });
      console.log('✅ Booking record created');

      // Set payment details to display in modal
      setPaymentDetails({
        ...paymentData,
        id: paymentDocRef.id,
        created_at: now
      });

      showToast('Booking accepted! Payment recorded.', 'success');
    } catch (error) {
      console.error('Error accepting booking:', error);
      showToast('Failed to accept booking: ' + error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      // Update booking_status in equipment_requests to "rejected"
      const requestRef = doc(db, 'equipment_requests', bookingId);
      await updateDoc(requestRef, {
        booking_status: 'rejected',
        rejection_reason: rejectionReason || 'Not specified',
        rejected_at: Timestamp.now()
      });

      showToast('Booking rejected.', 'info');
      setShowModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      showToast('Failed to reject booking: ' + error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      const requestRef = doc(db, 'equipment_requests', bookingId);
      await updateDoc(requestRef, {
        booking_status: 'completed',
        completed_at: Timestamp.now()
      });

      showToast('Booking marked as completed!', 'success');
    } catch (error) {
      console.error('Error completing booking:', error);
      showToast('Failed to complete booking.', 'error');
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    
    // Handle Date object or date string
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if valid date
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return dateObj.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '0 days';
    
    // Convert Firestore Timestamps if needed
    const startDate = start instanceof Date ? start : (start.toDate ? start.toDate() : new Date(start));
    const endDate = end instanceof Date ? end : (end.toDate ? end.toDate() : new Date(end));
    
    // Check if valid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '0 days';
    
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  // Calculate dynamic stats based on booking_status
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.booking_status === 'pending' || b.booking_status === 'open').length,
    accepted: bookings.filter(b => b.booking_status === 'accepted').length,
    completed: bookings.filter(b => b.booking_status === 'completed').length,
    rejected: bookings.filter(b => b.booking_status === 'rejected').length
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
              Rejected ({stats.rejected})
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
                        <h3>{booking.equipment_name || 'Equipment'}</h3>
                        <p className="equipment-type">📍 {booking.location || 'N/A'}</p>
                      </div>
                      <span className={`status-badge ${getStatusBadge(booking.booking_status).class}`}>
                        {getStatusBadge(booking.booking_status).text}
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
                        <span className="value price">
                          {booking.calculated_total != null
                            ? `₹${booking.calculated_total.toLocaleString()}`
                            : booking.total_price != null
                            ? `₹${booking.total_price.toLocaleString()}`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {(booking.booking_status === 'pending' || booking.booking_status === 'open') && (
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
                <p><strong>Total Price:</strong> ₹{(selectedBooking.calculated_total ?? selectedBooking.total_price)?.toLocaleString() || 'N/A'}</p>
              </div>

              <div className="modal-section">
                <h3>ℹ️ Request Information</h3>
                <p><strong>Request ID:</strong> {selectedBooking.id || 'N/A'}</p>
                <p><strong>Owner ID:</strong> {selectedBooking.owner_id || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${getStatusBadge(selectedBooking.booking_status).class}`}>
                  {getStatusBadge(selectedBooking.booking_status).text}
                </span></p>
                {selectedBooking.created_at && (
                  <p><strong>Created:</strong> {formatDate(selectedBooking.created_at)}</p>
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

              {(selectedBooking.booking_status === 'pending' || selectedBooking.booking_status === 'open') && (
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
              {(selectedBooking.booking_status === 'pending' || selectedBooking.booking_status === 'open') && (
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

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </div>
  );
}

export default Bookings;
