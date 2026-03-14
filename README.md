# 🌾 NammaKrishi — Farm Equipment Rental Marketplace

NammaKrishi is a comprehensive digital marketplace aimed at simplifying access to agricultural machinery by connecting farmers with equipment owners. The platform enables equipment discovery, rental requests, and streamlined booking workflows while introducing smart pricing, integrated communication, and automation features to improve accessibility and coordination in the agricultural ecosystem.

---

## 📌 Overview

Traditional access to farm equipment is fragmented, expensive, and heavily reliant on informal networks. NammaKrishi bridges this gap by providing a structured, technology-driven platform where:

- **Farmers (Customers)** can discover, search, book, and pay for agricultural equipment with multi-language support and voice search.
- **Equipment Owners** can list machinery, manage bookings, track earnings, and coordinate rentals through a dedicated portal.

---

## ✨ Features

### Owner Portal
- **Dashboard** — Real-time overview of bookings, earnings, and equipment status.
- **My Equipment** — List, edit, and manage farm machinery with image uploads.
- **Bookings Management** — View, approve, and track rental requests.
- **Earnings & Analytics** — Revenue tracking with visual charts using Recharts.
- **Payment Integration** — Razorpay-powered payment processing.
- **AI Assistant** — Gemini AI-powered assistant for smart recommendations and support.
- **Notifications** — Real-time alerts for booking updates and activity.
- **Maintenance Tracking** — Log and monitor equipment maintenance schedules.

### Customer Portal
- **Equipment Search** — Filter by name, category, location, price range, and availability.
- **Voice Search** — Multi-language support (Hindi, Tamil, Telugu, Kannada, Malayalam).
- **Equipment Details** — View comprehensive equipment information with images and pricing.
- **Booking System** — Select rental dates with interactive calendar and automatic price calculation.
- **Secure Payments** — Razorpay integration for safe payment processing.
- **My Bookings** — Track all bookings and payment status.
- **Cost Calculator** — Labor vs Equipment Cost comparison tool.
- **Offline Alerts** — Request notifications when specific equipment becomes available.
- **Multi-language Interface** — Support for 6+ languages.

### Smart Pricing & Automation
- Dynamic pricing engine for equipment rental rates.
- SMS notifications via Twilio for booking confirmations and updates.

---

## 🛠️ Tech Stack

### Frontend — Owner Portal
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| React Router DOM | Client-side routing |
| Recharts | Data visualization & analytics charts |
| React Calendar | Booking calendar UI |
| Axios | HTTP client for API communication |
| Firebase SDK | Authentication & Firestore integration |

### Frontend — Customer Portal
| Technology | Purpose |
|---|---|
| React 18 | UI framework (functional components & hooks) |
| React Router | Client-side navigation |
| Firebase Authentication | User login/signup |
| React Icons | UI icon elements |
| React Toastify | Toast notifications |
| Web Speech API | Voice search |
| CSS3 | Responsive design |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Firebase Admin SDK | Firestore database & server-side auth |
| Google Generative AI (Gemini) | AI assistant features |
| Razorpay | Payment gateway integration |
| Twilio | SMS notifications |
| Multer | File/image upload handling |
| Nodemon | Development auto-reload |

### Infrastructure & Services
| Service | Purpose |
|---|---|
| Firebase Firestore | NoSQL database |
| Firebase Storage | Equipment images |
| Firebase Cloud Functions | Backend logic & payment verification |
| Firebase Cloud Messaging | Push notifications |
| Firebase Hosting | Customer portal deployment |
| Railway | Backend server deployment |
| Razorpay | Payment processing |

---

## 🗂️ Project Structure

```
nammakrishi/
│
├── farm-rental-backend/          # Node.js + Express REST API
│   ├── server.js                 # Entry point
│   ├── config/
│   │   └── firebase.js           # Firebase Admin configuration
│   ├── controllers/              # Route handler logic
│   │   ├── aiController.js
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── dashboardController.js
│   │   ├── earningsController.js
│   │   ├── equipmentController.js
│   │   ├── maintenanceController.js
│   │   ├── notificationController.js
│   │   ├── paymentController.js
│   │   ├── pricingController.js
│   │   └── uploadController.js
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT/Firebase token verification
│   ├── routes/                   # Express route definitions
│   └── utils/
│       ├── aiUtils.js            # Gemini AI helper functions
│       └── smsUtils.js           # Twilio SMS helpers
│
├── owner-portal-app/             # React owner-facing frontend
│   └── src/
│       ├── components/
│       │   ├── Login.js          # Auth with role-based routing
│       │   ├── Dashboard.js
│       │   ├── MyEquipment.js
│       │   ├── Bookings.js
│       │   ├── Payment.js
│       │   ├── Earnings.js
│       │   ├── AiAssistant.js
│       │   └── Sidebar.js
│       └── services/
│           ├── api.js            # Axios API service layer
│           └── authService.js    # Authentication service
│
└── customer-portal (skit_web)/   # React customer-facing frontend
    └── src/
        ├── components/
        │   ├── EquipmentCard
        │   ├── VoiceSearchInput
        │   ├── BookingCalendar
        │   ├── RazorpayPaymentModal
        │   ├── CostComparisonCalculator
        │   └── Navbar
        ├── pages/
        │   ├── HomePage
        │   ├── EquipmentDetailsPage
        │   ├── MyBookingsPage
        │   ├── CostCalculatorPage
        │   ├── LoginPage
        │   └── SignupPage
        ├── services/
        │   ├── firebase.js
        │   ├── authService.js
        │   ├── equipmentService.js
        │   ├── bookingService.js
        │   └── equipmentRequestService.js
        ├── hooks/
        │   ├── useAuth.js
        │   └── useFetch.js
        └── utils/
            ├── helpers.js
            ├── voiceSearchUtils.js
            └── notificationUtils.js
```

---

## 🗄️ Firestore Collections

```
users/
├── id (uid)
├── name
├── email
├── phone
├── language_preference
└── created_at

equipment/
├── id
├── name
├── category
├── description
├── price_per_hour
├── price_per_day
├── location
├── availability_status
├── image_url
└── created_at

bookings/
├── id
├── equipment_id
├── customer_id
├── start_date
├── end_date
├── total_price
├── booking_status
├── payment_status
└── created_at

payments/
├── id
├── booking_id
├── razorpay_order_id
├── razorpay_payment_id
├── razorpay_signature
├── payment_status
└── created_at

equipment_requests/
├── id
├── customer_id
├── equipment_name
├── location
├── booking_status
└── created_at
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- Firebase project with Firestore, Storage, and Cloud Functions enabled
- Razorpay merchant account (for payments)
- Twilio account (for SMS)

### 1. Clone the Repository
```bash
git clone https://github.com/Supreetha2513/NammaKrishi.git
cd NammaKrishi
```

### 2. Backend Setup
```bash
cd farm-rental-backend
npm install
```

Create a `.env` file in `farm-rental-backend/`:
```env
PORT=5000
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
GEMINI_API_KEY=your_gemini_api_key
```

Place your Firebase service account key at `config/serviceAccountKey.json`.

Start the backend:
```bash
npx nodemon server.js
```

### 3. Owner Portal Setup
```bash
cd owner-portal-app
npm install
npm start
```

The owner portal runs at `http://localhost:3000`.

### 4. Customer Portal Setup
```bash
cd skit_web
npm install
```

Configure environment variables:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_SMS_API_KEY=your_sms_api_key
```

Setup and deploy Firebase Cloud Functions:
```bash
cd functions
npm install
firebase deploy --only firestore:rules
firebase deploy --only functions
```

Start the customer portal:
```bash
npm start
```

The customer portal runs at `http://localhost:3000`.

---

## 🔐 Authentication & Role-based Routing

On login/registration, users select their role:

| Role | Redirect |
|---|---|
| **Owner** | `/dashboard` — Owner portal |
| **Customer** | `https://customer-2005.web.app` — Customer portal |

### Authentication Flow
1. User signs up with email, password, and details.
2. Firebase Authentication creates the account.
3. User data stored in Firestore.
4. Login persists across sessions.
5. Protected routes require authentication.

---

## 💳 Payment Flow

1. Customer selects equipment and rental dates.
2. System calculates total price automatically.
3. Booking created in Firestore.
4. Cloud Function creates a Razorpay order.
5. Razorpay checkout opens for the customer.
6. After payment, Cloud Function verifies the signature.
7. Payment recorded and booking confirmed.

---

## 🔔 Notification System

### SMS Notifications
- Triggered when requested equipment becomes available.
- Cloud Function monitors equipment status changes.
- Sends SMS to the customer's phone number via Twilio.
- Updates request status to "notified".

### Push Notifications
- Firebase Cloud Messaging for push alerts.
- Notification permission requested on first visit.

---

## 🎤 Voice Search

Supported languages:
| Language | Code |
|---|---|
| English | en-US |
| Hindi | hi-IN |
| Tamil | ta-IN |
| Telugu | te-IN |
| Kannada | kn-IN |
| Malayalam | ml-IN |

Uses Web Speech API for real-time voice recognition.

---

## 📊 Cost Calculator

Compare labor costs vs equipment rental:
- **Input**: Land size, labor wage, number of workers, equipment price, rental days.
- **Output**: Total costs, savings, cheaper option, estimated time saved.

---

## 📡 Cloud Function API Endpoints

**POST /createRazorpayOrder**
- Creates a Razorpay order.
- Request: `{ booking_id, amount, currency, equipment_name }`
- Response: `{ order_id, amount, currency }`

**POST /verifyPayment**
- Verifies payment signature.
- Request: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- Response: `{ success: true/false }`

**POST /sendTestSMS**
- Sends a test SMS notification.
- Request: `{ phone, message }`
- Response: `{ success: true }`

---

## 🔐 Firestore Security Rules

Rules are configured to:
- Allow users to read/write only their own data.
- Allow authenticated users to read equipment listings.
- Allow creating bookings and equipment requests.
- Restrict equipment writing to admin only.

---

## 🚀 Deployment

### Owner Portal (Firebase Hosting)
```bash
cd owner-portal-app
npm run build
firebase deploy --only hosting
```

### Customer Portal (Firebase Hosting)
```bash
cd skit_web
npm run build
firebase deploy --only hosting
```

### Cloud Functions
```bash
firebase deploy --only functions
```

### Complete Deployment
```bash
firebase deploy
```

---

## 🌐 Deployed Applications

| Portal | URL |
|---|---|
| Owner Portal | https://customer-2005.web.app *(owner login → redirects internally)* |
| Customer Portal | https://customer-2005.web.app |
| Backend API | https://trumusefinal-production.up.railway.app |

---

## 🎯 Future Enhancements

- [ ] Rating and review system for equipment and owners
- [ ] Real-time chat support between farmers and owners
- [ ] Equipment price analytics dashboard
- [ ] Booking history with downloadable invoices
- [ ] Favorites / Wishlist feature
- [ ] Referral program
- [ ] Equipment damage insurance integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics for owners
- [ ] Pagination for large equipment listings

---

## 📱 Responsive Design

- Mobile-first approach tailored for phones, tablets, and desktops.
- Responsive grid layouts with touch-friendly buttons and inputs.

---

## 👩‍💻 Author

Developed as part of **NammaKrishi** — a platform to modernize agricultural equipment access and empower the farming community through technology.

---

Built with ❤️ for Indian Farmers 🌾
