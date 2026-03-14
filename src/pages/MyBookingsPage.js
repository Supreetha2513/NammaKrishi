import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BookingService from "../services/bookingService";
import EquipmentService from "../services/equipmentService";
import equipmentRequestService from "../services/equipmentRequestService";
import { useAuth } from "../hooks/useAuth";
import {
  formatCurrency,
  formatDate,
  getBookingStatus,
  getPaymentStatus,
} from "../utils/helpers";
import { FiArrowLeft, FiX, FiBell } from "react-icons/fi";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Timestamp } from "firebase/firestore";
import { storage } from "../services/firebase";
import "./MyBookingsPage.css";

const PaymentCard = ({ payment, onPaymentSubmit }) => {
  const [paymentId, setPaymentId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentId || !transactionId || !screenshotFile) {
      alert("Please fill all payment details including screenshot");
      return;
    }

    setSubmitting(true);

    // Wait 20 seconds
    setTimeout(async () => {
      setSubmitting(false);
      setSubmitted(true);

      // Execute all operations
      await onPaymentSubmit(payment.id, {
        payment_id: paymentId,
        payment_method: paymentMethod,
        upi_transaction_id: transactionId,
        screenshot: screenshotFile,
      });
    }, 10000);
  };

  if (submitted) {
    return (
      <div className="payment-card payment-done">
        <div className="payment-header">
          <h4>{payment.equipment_name}</h4>
          <span className="status-badge" style={{ backgroundColor: "#10b981" }}>
            ✓ Done
          </span>
        </div>

        <div className="payment-details">
          <div className="detail-item">
            <span className="label">Dates:</span>
            <span className="value">
              {formatDate(payment.start_date)} to {formatDate(payment.end_date)}
            </span>
          </div>

          <div className="detail-item">
            <span className="label">Total Amount:</span>
            <span className="value" style={{ color: "#10b981", fontSize: "16px" }}>
              {formatCurrency(payment.amount)}
            </span>
          </div>

          <div className="detail-item">
            <span className="label">Payment Status:</span>
            <span className="value">Completed</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-card">
      <div className="payment-header">
        <h4>{payment.equipment_name}</h4>
        <span className="status-badge" style={{ backgroundColor: "#3b82f6" }}>
          Awaiting Payment
        </span>
      </div>

      <div className="payment-details">
        <div className="detail-item">
          <span className="label">Dates:</span>
          <span className="value">
            {formatDate(payment.start_date)} to {formatDate(payment.end_date)}
          </span>
        </div>

        <div className="detail-item">
          <span className="label">Total Amount:</span>
          <span className="value">{formatCurrency(payment.amount)}</span>
        </div>

        {payment.owner_id && (
          <div className="detail-item">
            <span className="label">Owner ID:</span>
            <span className="value">{payment.owner_id}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label>Payment ID</label>
          <input
            type="text"
            placeholder="Enter Payment ID"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          >
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Transaction ID / Reference</label>
          <input
            type="text"
            placeholder="Enter UPI Transaction ID or Reference Number"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Payment Screenshot</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshotFile(e.target.files[0])}
            required
          />
          {screenshotFile && (
            <span className="file-name">Selected: {screenshotFile.name}</span>
          )}
        </div>

        <button type="submit" disabled={submitting || submitted} className="submit-btn">
          {submitting ? "Submitting..." : submitted ? "Submitted" : "Submit Payment"}
        </button>
      </form>
    </div>
  );
};

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [equipmentMap, setEquipmentMap] = useState({});
  const [activeTab, setActiveTab] = useState("bookings");

  const [equipmentNotAvailableName, setEquipmentNotAvailableName] =
    useState("");
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const bookingsData =
        await BookingService.getBookingsByCustomerId(user.uid);

      setBookings(bookingsData);

      const equipMap = {};

      for (const booking of bookingsData) {
        if (!equipMap[booking.equipment_id]) {
          const equip = await EquipmentService.getEquipmentById(
            booking.equipment_id
          );

          if (equip) {
            equipMap[booking.equipment_id] = equip;
          }
        }
      }

      setEquipmentMap(equipMap);

      const requestsData =
        await equipmentRequestService.getRequestsByCustomerId(user.uid);

      setRequests(requestsData);

      // Fetch accepted requests for payments
      let acceptedRequestsData =
        await BookingService.getAcceptedRequestsByCustomerId(user.uid);

      // Enrich accepted requests with amount calculation
      acceptedRequestsData = await Promise.all(
        acceptedRequestsData.map(async (request) => {
          if (!request.amount && request.equipment_id) {
            try {
              const equipment = await EquipmentService.getEquipmentById(request.equipment_id);
              const pricePerDay = equipment.price_per_day || 0;
              const startDate = new Date(request.start_date);
              const endDate = new Date(request.end_date);
              const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
              request.amount = pricePerDay * Math.max(days, 1);
            } catch (e) {
              console.warn("Could not calculate amount for request", request.id, e);
              request.amount = 0;
            }
          }
          return request;
        })
      );

      setPayments(acceptedRequestsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOfflineRequest = async (e) => {
    e.preventDefault();

    if (!equipmentNotAvailableName.trim()) {
      alert("Please enter equipment name");
      return;
    }

    try {
      await equipmentRequestService.createEquipmentRequest({
        customer_id: user.uid,
        equipment_name: equipmentNotAvailableName,
        location: user.userData?.location || "",
        booking_status: "pending",
      });

      alert("Request created successfully");

      setEquipmentNotAvailableName("");
      setShowOfflineAlert(false);

      fetchData();
    } catch (error) {
      console.error("Error creating request:", error);
      alert("Failed to create request");
    }
  };

  const handlePaymentSubmit = async (requestId, paymentDetails) => {
    try {
      // Upload screenshot to Firebase Storage
      const screenshotRef = ref(
        storage,
        `payment_screenshots/${user.uid}/${requestId}_${Date.now()}`
      );

      await uploadBytes(screenshotRef, paymentDetails.screenshot);
      const screenshotUrl = await getDownloadURL(screenshotRef);

      // Find the request to get owner_id
      const request = payments.find((p) => p.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      // Calculate amount from equipment pricing if not present
      let amount = request.amount;
      if (!amount && request.equipment_id) {
        try {
          const equipment = await EquipmentService.getEquipmentById(request.equipment_id);
          const pricePerDay = equipment.price_per_day || 0;
          const startDate = new Date(request.start_date);
          const endDate = new Date(request.end_date);
          const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          amount = pricePerDay * Math.max(days, 1);
        } catch (e) {
          console.warn("Could not calculate amount", e);
          amount = 0;
        }
      }

      // Create payment record
      const paymentRecord = {
        request_id: requestId,
        equipment_id: request.equipment_id,
        equipment_name: request.equipment_name,
        customer_id: user.uid,
        owner_id: request.owner_id,
        payment_id: paymentDetails.payment_id,
        payment_method: paymentDetails.payment_method,
        upi_transaction_id: paymentDetails.upi_transaction_id,
        payment_screenshot_url: screenshotUrl,
        amount: amount,
        payment_status: "completed",
        start_date: request.start_date,
        end_date: request.end_date,
      };

      // Create payment in payments collection
      await BookingService.createOrUpdatePayment(paymentRecord);

      // Create notification
      await BookingService.createNotification({
        type: "payment_submitted",
        request_id: requestId,
        owner_id: request.owner_id,
        customer_id: user.uid,
        message: "Customer submitted payment proof",
        created_at: Timestamp.now(),
      });

      alert("Payment submitted successfully");
      fetchData();
    } catch (error) {
      console.error("Payment submission error:", error);
      alert("Failed to submit payment: " + error.message);
    }
  };

  if (!user) {
    return (
      <div className="auth-prompt">
        <h1>My Bookings</h1>
        <p>Please sign in to view bookings</p>
        <button onClick={() => navigate("/login")}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <button className="back-btn" onClick={() => navigate("/")}>
        <FiArrowLeft size={24} />
        Back
      </button>

      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Manage your rentals</p>

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
            <h3>Request Equipment</h3>
            <button onClick={() => setShowOfflineAlert(false)}>
              <FiX />
            </button>
          </div>

          <form onSubmit={handleCreateOfflineRequest}>
            <input
              type="text"
              value={equipmentNotAvailableName}
              onChange={(e) =>
                setEquipmentNotAvailableName(e.target.value)
              }
              placeholder="Enter equipment name"
              required
            />

            <button type="submit">Request Alert</button>
          </form>
        </div>
      )}

      <div className="tabs">
        <button
          className={activeTab === "bookings" ? "tab active" : "tab"}
          onClick={() => setActiveTab("bookings")}
        >
          Active Bookings ({bookings.length})
        </button>

        <button
          className={activeTab === "requests" ? "tab active" : "tab"}
          onClick={() => setActiveTab("requests")}
        >
          Equipment Requests ({requests.length})
        </button>

        <button
          className={activeTab === "payments" ? "tab active" : "tab"}
          onClick={() => setActiveTab("payments")}
        >
          Payments ({payments.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "bookings" && (
          <div>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : bookings.length === 0 ? (
              <div className="no-data">No bookings</div>
            ) : (
              bookings.map((booking) => {
                const equipment = equipmentMap[booking.equipment_id];
                const bookingStatus = getBookingStatus(
                  booking.booking_status
                );
                const paymentStatus = getPaymentStatus(
                  booking.payment_status
                );

                return (
                  <div key={booking.id} className="booking-card">
                    <h3>{equipment?.name}</h3>

                    <p>
                      {formatDate(booking.start_date)} -{" "}
                      {formatDate(booking.end_date)}
                    </p>

                    <p>{equipment?.location}</p>

                    <p>{formatCurrency(booking.total_price)}</p>

                    <span
                      className="status-badge"
                      style={{ backgroundColor: paymentStatus.color }}
                    >
                      {paymentStatus.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="no-data">No requests</div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="request-card">
                  <h4>{request.equipment_name}</h4>

                  {request.start_date && (
                    <p>
                      {formatDate(request.start_date)} -{" "}
                      {formatDate(request.end_date)}
                    </p>
                  )}

                  <p>{request.location}</p>

                  <p>{formatDate(request.created_at)}</p>

                  <span className="status-badge">
                    {request.status || request.booking_status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : payments.length === 0 ? (
              <div className="no-data">No pending payments</div>
            ) : (
              <>
                <div className="payments-summary">
                  <div className="summary-card">
                    <span className="summary-label">Total Pending Payments</span>
                    <span className="summary-amount">
                      {formatCurrency(
                        payments.reduce((sum, p) => sum + (p.amount || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
                <div className="payments-list">
                  {payments.map((payment) => (
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                      onPaymentSubmit={handlePaymentSubmit}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;