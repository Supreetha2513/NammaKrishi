import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingService from '../services/bookingService';
import EquipmentService from '../services/equipmentService';
import equipmentRequestService from '../services/equipmentRequestService';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate, getBookingStatus, getPaymentStatus } from '../utils/helpers';
import { FiArrowLeft, FiX, FiBell } from 'react-icons/fi';
import './MyBookingsPage.css';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [equipmentMap, setEquipmentMap] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [equipmentNotAvailableName, setEquipmentNotAvailableName] = useState('');
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch bookings
      const bookingsData = await BookingService.getBookingsByCustomerId(user.uid);
      setBookings(bookingsData);

      // Fetch equipment details for all bookings
      const equipMap = {};
      for (const booking of bookingsData) {
        if (!equipMap[booking.equipment_id]) {
          const equip = await EquipmentService.getEquipmentById(booking.equipment_id);
          if (equip) {
            equipMap[booking.equipment_id] = equip;
          }
        }
      }
      setEquipmentMap(equipMap);

      // Fetch equipment requests
      const requestsData = await equipmentRequestService.getRequestsByCustomerId(user.uid);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOfflineRequest = async (e) => {
    e.preventDefault();

    if (!equipmentNotAvailableName.trim()) {
      alert('Please enter equipment name');
      return;
    }

    try {
      await equipmentRequestService.createEquipmentRequest({
        customer_id: user.uid,
        equipment_name: equipmentNotAvailableName,
        location: user.userData?.location || '',
        request_status: 'pending',
      });

      alert('Request created! You will be notified when this equipment is available.');
      setEquipmentNotAvailableName('');
      setShowOfflineAlert(false);
      fetchData();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create request');
    }
  };

  if (!user) {
    return (
      <div className="auth-prompt">
        <h1>My Bookings</h1>
        <p>Please sign in to view your bookings</p>
        <button onClick={() => navigate('/login')}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        <FiArrowLeft size={24} />
        Back
      </button>

      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Manage your equipment rentals</p>

        <button
          className="offline-alert-btn"
          onClick={() => setShowOfflineAlert(!showOfflineAlert)}
        >
          <FiBell size={20} />
          Offline Alert
        </button>
      </div>

      {showOfflineAlert && (
        <div className="offline-alert-form">
          <div className="form-header">
            <h3>Request Equipment When Available</h3>
            <button className="close-btn" onClick={() => setShowOfflineAlert(false)}>
              <FiX size={20} />
            </button>
          </div>
          <form onSubmit={handleCreateOfflineRequest}>
            <input
              type="text"
              value={equipmentNotAvailableName}
              onChange={(e) => setEquipmentNotAvailableName(e.target.value)}
              placeholder="Enter equipment name (e.g., Tractor, Harvester)"
              required
            />
            <button type="submit">Request Alert</button>
          </form>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Active Bookings ({bookings.length})
        </button>
        <button
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Equipment Requests ({requests.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            {loading ? (
              <div className="loading">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="no-data">
                <p>No bookings yet</p>
                <button onClick={() => navigate('/')}>Search Equipment</button>
              </div>
            ) : (
              <div className="bookings-list">
                {bookings.map((booking) => {
                  const equipment = equipmentMap[booking.equipment_id];
                  const bookingStatus = getBookingStatus(booking.booking_status);
                  const paymentStatus = getPaymentStatus(booking.payment_status);

                  return (
                    <div key={booking.id} className="booking-card">
                      <div className="booking-header">
                        <h3>{equipment?.name || 'Equipment'}</h3>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: bookingStatus.color }}
                        >
                          {bookingStatus.label}
                        </span>
                      </div>

                      <div className="booking-details">
                        <div className="detail-item">
                          <span className="label">Dates:</span>
                          <span className="value">
                            {formatDate(booking.start_date)} to {formatDate(booking.end_date)}
                          </span>
                        </div>

                        <div className="detail-item">
                          <span className="label">Location:</span>
                          <span className="value">{equipment?.location}</span>
                        </div>

                        <div className="detail-item">
                          <span className="label">Total Price:</span>
                          <span className="value">
                            {formatCurrency(booking.total_price)}
                          </span>
                        </div>

                        <div className="detail-item">
                          <span className="label">Payment Status:</span>
                          <span
                            className="status-badge payment"
                            style={{ backgroundColor: paymentStatus.color }}
                          >
                            {paymentStatus.label}
                          </span>
                        </div>
                      </div>

                      {equipment?.description && (
                        <div className="equipment-description">
                          <p>{equipment.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-section">
            {loading ? (
              <div className="loading">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="no-data">
                <p>No equipment requests yet</p>
                <button onClick={() => setShowOfflineAlert(true)}>Create Request</button>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map((request) => {
                  const statusColors = {
                    pending: '#f59e0b',
                    notified: '#3b82f6',
                    fulfilled: '#10b981',
                  };

                  return (
                    <div key={request.id} className="request-card">
                      <div className="request-header">
                        <h4>{request.equipment_name}</h4>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: statusColors[request.request_status] }}
                        >
                          {request.request_status}
                        </span>
                      </div>

                      <div className="request-details">
                        <p>
                          <strong>Location:</strong> {request.location}
                        </p>
                        <p>
                          <strong>Requested on:</strong> {formatDate(request.created_at)}
                        </p>
                        <p className="info-text">
                          You will receive a notification when this equipment becomes available.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
