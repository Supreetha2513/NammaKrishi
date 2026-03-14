import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import './RazorpayPaymentModal.css';

const RazorpayPaymentModal = ({ isOpen, onClose, orderDetails, onPaymentSuccess, onPaymentError }) => {
  useEffect(() => {
    if (!isOpen) return;

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Script loaded
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen]);

  const handlePayment = () => {
    if (!window.Razorpay) {
      onPaymentError('Razorpay script failed to load');
      return;
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: Math.round(orderDetails.amount * 100), // Convert to paise
      currency: orderDetails.currency || 'INR',
      name: 'NammaKrishi',
      description: orderDetails.description,
      order_id: orderDetails.orderId,
      prefill: {
        name: orderDetails.customerName,
        email: orderDetails.customerEmail,
        contact: orderDetails.customerPhone,
      },
      handler: (response) => {
        if (onPaymentSuccess) {
          onPaymentSuccess(response);
        }
        onClose();
      },
      modal: {
        ondismiss: () => {
          if (onPaymentError) {
            onPaymentError('Payment cancelled by user');
          }
        },
      },
      theme: {
        color: '#10b981',
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      onPaymentError(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="razorpay-modal-overlay" onClick={onClose}>
      <div className="razorpay-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Payment Details</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="payment-details">
            <div className="detail-row">
              <span className="label">Equipment:</span>
              <span className="value">{orderDetails.equipmentName}</span>
            </div>
            <div className="detail-row">
              <span className="label">Booking Period:</span>
              <span className="value">{orderDetails.days} days</span>
            </div>
            <div className="detail-row">
              <span className="label">Amount:</span>
              <span className="value highlight">
                {orderDetails.currency} {orderDetails.amount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="pay-btn" onClick={handlePayment}>
              Pay Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPaymentModal;
