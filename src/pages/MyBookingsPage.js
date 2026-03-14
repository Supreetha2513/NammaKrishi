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
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!transactionId || !screenshotFile) {
      alert("Please provide transaction ID and screenshot");
      return;
    }

    onPaymentSubmit(payment.id, transactionId, screenshotFile);
  };

  return (
    <div className="payment-card">
      <div className="payment-header">
        <h4>{payment.equipment_name}</h4>
        <span className="status-badge" style={{ backgroundColor: "#f59e0b" }}>
          Payment Pending
        </span>
      </div>

      <div className="payment-details">
        <p>
          <strong>Owner ID:</strong> {payment.owner_id}
        </p>

        <p>
          <strong>Dates:</strong>{" "}
          {formatDate(payment.start_date)} to {formatDate(payment.end_date)}
        </p>

        <p>
          <strong>Total Price:</strong> {formatCurrency(payment.total_price)}
        </p>

        {payment.upi_id && (
          <p>
            <strong>Owner UPI:</strong> {payment.upi_id}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        <input
          type="text"
          placeholder="Enter UPI Transaction ID"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          required
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setScreenshotFile(e.target.files[0])}
          required
        />

        <button type="submit">Submit Payment</button>
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

      const paymentsData =
        await BookingService.getBookingsByCustomerIdAndPaymentStatus(
          user.uid,
          "awaiting_payment"
        );

      setPayments(paymentsData);
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

  const handlePaymentSubmit = async (paymentId, transactionId, screenshot) => {
    try {
      const storageRef = ref(
        storage,
        `payment_screenshots/${paymentId}_${Date.now()}`
      );

      await uploadBytes(storageRef, screenshot);

      const screenshotUrl = await getDownloadURL(storageRef);

      await BookingService.updatePayment(paymentId, {
        upi_transaction_id: transactionId,
        payment_screenshot_url: screenshotUrl,
        payment_status: "submitted",
      });

      await BookingService.updateBookingPaymentStatus(paymentId, "submitted");

      const payment = payments.find((p) => p.id === paymentId);

      await BookingService.createNotification({
        type: "payment_submitted",
        booking_id: paymentId,
        owner_id: payment.owner_id,
        customer_id: user.uid,
        message: "Customer submitted payment proof",
        created_at: Timestamp.now(),
      });

      alert("Payment submitted successfully");

      fetchData();
    } catch (error) {
      console.error("Payment submission error:", error);
      alert("Failed to submit payment");
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
                      style={{ backgroundColor: bookingStatus.color }}
                    >
                      {bookingStatus.label}
                    </span>

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
              payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onPaymentSubmit={handlePaymentSubmit}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;