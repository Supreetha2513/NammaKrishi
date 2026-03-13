import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingCalendar from '../components/BookingCalendar';
import RazorpayPaymentModal from '../components/RazorpayPaymentModal';
import BookingService from '../services/bookingService';
import { useAuth } from '../hooks/useAuth';
import { calculateTotalPrice, formatCurrency, formatDate } from '../utils/helpers';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiMapPin, FiClock } from 'react-icons/fi';
import './EquipmentDetailsPage.css';

const EquipmentDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const equipment = location.state?.equipment;

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  if (!equipment) {
    return (
      <div className="equipment-details-error">
        <p>Equipment not found</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  const handleDatesSelected = (start, end) => {
    setStartDate(start);
    setEndDate(end);

    const price = calculateTotalPrice(
      equipment.price_per_day,
      equipment.price_per_hour,
      start,
      end
    );
    setTotalPrice(price);
  };

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select rental dates');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        equipment_id: equipment.id,
        customer_id: user.uid,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        booking_status: 'pending',
        payment_status: 'pending',
      };

      const booking = await BookingService.createBooking(bookingData);

      // Create Razorpay order
      const orderResponse = await BookingService.createRazorpayOrder({
        booking_id: booking.id,
        amount: totalPrice,
        currency: 'INR',
        equipment_name: equipment.name,
      });

      setOrderDetails({
        orderId: orderResponse.order_id,
        amount: totalPrice,
        currency: 'INR',
        equipmentName: equipment.name,
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
        customerName: user.displayName || 'Customer',
        customerEmail: user.email,
        customerPhone: user.phone || '',
        description: `Booking for ${equipment.name}`,
      });

      setShowPaymentModal(true);
    } catch (error) {
      toast.error('Failed to create booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      // Verify payment
      const verifyResponse = await BookingService.verifyPayment({
        razorpay_order_id: orderDetails.orderId,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });

      if (verifyResponse.success) {
        toast.success('Payment successful! Booking confirmed.');
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2000);
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      toast.error('Payment error: ' + error.message);
    }
  };

  const handlePaymentError = (error) => {
    toast.error('Payment failed: ' + error);
    setShowPaymentModal(false);
  };

  return (
    <div className="equipment-details-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        <FiArrowLeft size={24} />
        Back
      </button>

      <div className="details-container">
        <div className="image-section">
          <img
            src={equipment.image_url || '/placeholder-equipment.jpg'}
            alt={equipment.name}
            onError={(e) => {
              e.target.src = '/placeholder-equipment.jpg';
            }}
          />
        </div>

        <div className="details-section">
          <h1>{equipment.name}</h1>
          <p className="category">{equipment.category}</p>

          <div className="info-grid">
            <div className="info-item">
              <FiMapPin size={20} />
              <div>
                <p className="label">Location</p>
                <p className="value">{equipment.location}</p>
              </div>
            </div>

            <div className="info-item">
              <FiClock size={20} />
              <div>
                <p className="label">Availability</p>
                <p className="value">{equipment.availability_status}</p>
              </div>
            </div>
          </div>

          <div className="description">
            <h3>Description</h3>
            <p>{equipment.description}</p>
          </div>

          <div className="pricing">
            <h3>Pricing</h3>
            <div className="price-row">
              <span>Per Day:</span>
              <span>{formatCurrency(equipment.price_per_day)}</span>
            </div>
            <div className="price-row">
              <span>Per Hour:</span>
              <span>{formatCurrency(equipment.price_per_hour)}</span>
            </div>
          </div>

          {startDate && endDate && (
            <div className="booking-summary">
              <h3>Booking Summary</h3>
              <div className="summary-row">
                <span>Start Date:</span>
                <span>{formatDate(startDate)}</span>
              </div>
              <div className="summary-row">
                <span>End Date:</span>
                <span>{formatDate(endDate)}</span>
              </div>
              <div className="summary-row total">
                <span>Total Price:</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          )}

          <button
            className="book-btn"
            onClick={handleBooking}
            disabled={loading || equipment.availability_status !== 'available'}
          >
            {loading ? 'Processing...' : 'Book Now'}
          </button>
        </div>
      </div>

      <div className="calendar-section">
        <BookingCalendar
          onSelectDates={handleDatesSelected}
          minDate={new Date()}
        />
      </div>

      <RazorpayPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderDetails={orderDetails}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </div>
  );
};

export default EquipmentDetailsPage;
