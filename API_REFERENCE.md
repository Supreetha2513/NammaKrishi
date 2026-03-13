# API Reference

## Cloud Functions Endpoints

All endpoints are HTTP callable from the frontend at:
```
https://<region>-<project-id>.cloudfunctions.net/
```

For local development:
```
http://localhost:5000
```

---

## 1. Create Razorpay Order

**Endpoint:** `POST /createRazorpayOrder`

**Purpose:** Creates a Razorpay order for booking payment

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "booking_id": "booking_123",
  "amount": 5000,
  "currency": "INR",
  "equipment_name": "John Deere Tractor"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "order_id": "order_1234567890",
  "amount": 5000,
  "currency": "INR"
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Missing required fields"
}
```

**Usage Example (Frontend):**
```javascript
const response = await fetch('http://localhost:5000/createRazorpayOrder', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    booking_id: bookingId,
    amount: totalPrice,
    currency: 'INR',
    equipment_name: equipmentName
  })
});

const data = await response.json();
console.log('Order ID:', data.order_id);
```

---

## 2. Verify Payment

**Endpoint:** `POST /verifyPayment`

**Purpose:** Verifies payment signature and updates booking status

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "signature_hash"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Signature verification failed"
}
```

**Usage Example (Frontend):**
```javascript
const response = await fetch('http://localhost:5000/verifyPayment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    razorpay_order_id: orderDetails.razorpay_order_id,
    razorpay_payment_id: paymentResponse.razorpay_payment_id,
    razorpay_signature: paymentResponse.razorpay_signature
  })
});

const data = await response.json();
if (data.success) {
  console.log('Payment verified!');
}
```

---

## 3. Send Test SMS

**Endpoint:** `POST /sendTestSMS`

**Purpose:** Sends test SMS for verification

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "message": "Your equipment is now available!"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "SMS sent successfully"
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Failed to send SMS"
}
```

---

## Firestore Collections & Queries

### Users Collection
```
GET /users/{userId}
- Retrieve user profile
- Returns: { name, email, phone, language_preference, created_at }

PUT /users/{userId}
- Update user profile
- Available fields: name, phone, language_preference
```

### Equipment Collection
```
GET /equipment
- Get all equipment
- Returns: Array of equipment documents

GET /equipment/{equipmentId}
- Get specific equipment
- Returns: Single equipment document with all details

Query by category:
- /equipment?category=Tractor
- Returns: Equipment filtered by category

Query by location:
- /equipment?location=Punjab
- Returns: Equipment filtered by location
```

### Bookings Collection
```
GET /bookings?customer_id={userId}
- Get all customer bookings
- Returns: Array of booking documents

GET /bookings/{bookingId}
- Get specific booking details
- Returns: Single booking with equipment info

POST /bookings
- Create new booking
- Body: {
    equipment_id,
    customer_id,
    start_date,
    end_date,
    total_price
  }

PUT /bookings/{bookingId}
- Update booking status
- Body: { booking_status, payment_status }
```

### Equipment Requests Collection
```
GET /equipment_requests?customer_id={userId}
- Get customer's equipment requests
- Returns: Array of request documents

POST /equipment_requests
- Create new request
- Body: {
    customer_id,
    equipment_name,
    location
  }
```

### Payments Collection
```
GET /payments/{bookingId}
- Get payment details
- Returns: Payment document

POST /payments
- Create payment record
- Auto-created by cloud function
```

---

## Error Codes & Meanings

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request body and headers |
| 401 | Unauthorized | Ensure user is authenticated |
| 403 | Forbidden | Check Firestore security rules |
| 404 | Not Found | Verify resource exists |
| 500 | Internal Server Error | Check Cloud Function logs |
| 600 | Payment Failed | Verify Razorpay configuration |
| 700 | SMS Send Failed | Check SMS API credentials |

---

## Security Considerations

1. **API Keys:** Keep Razorpay key secret in environment variables
2. **CORS:** Frontend and backend must be on allowed domains
3. **Authentication:** All requests require Firebase authentication
4. **Validation:** Server-side validation of all inputs
5. **Rate Limiting:** Implement rate limiting on sensitive endpoints
6. **Signature Verification:** Always verify Razorpay payment signatures

---

## Rate Limiting

Recommended limits:
- Payment verification: 10 requests/minute per user
- SMS sending: 5 SMS/minute per user
- Booking creation: 20 bookings/hour per user
- Equipment search: 100 searches/minute per user

---

## Webhooks (Optional)

### Razorpay Payment Webhook
```
POST /webhook/razorpay
Body: {
  event: "payment.authorized" | "payment.failed",
  payload: { payment_id, order_id, ... }
}
```

### Equipment Availability Webhook
```
POST /webhook/equipment-available
Body: {
  equipment_id,
  equipment_name,
  customers_to_notify: [...]
}
```

---

## Development vs Production

### Development
- Base URL: `http://localhost:5000`
- Razorpay: Test mode (test keys)
- Firestore: Emulator (optional)
- SMS: Logging only (no actual SMS)

### Production
- Base URL: `https://<region>-<project-id>.cloudfunctions.net`
- Razorpay: Live mode (live keys)
- Firestore: Production database
- SMS: Actual SMS delivery

---

## Testing API Endpoints

### Using cURL

```bash
# Create Razorpay Order
curl -X POST http://localhost:5000/createRazorpayOrder \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "test_123",
    "amount": 5000,
    "currency": "INR",
    "equipment_name": "Test Tractor"
  }'

# Verify Payment
curl -X POST http://localhost:5000/verifyPayment \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_123",
    "razorpay_payment_id": "pay_123",
    "razorpay_signature": "signature_123"
  }'
```

### Using Postman

1. Import the collection: `postman_collection.json`
2. Set environment variables
3. Run requests in sequence

---

## Response Pagination (Future Enhancement)

For large result sets, implement pagination:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

---

Last Updated: January 2024
