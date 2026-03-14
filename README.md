# NammaKrishi Marketplace

A comprehensive web application for farmers to search, book, and pay for agricultural machinery rentals with multi-language support, secure payments, and SMS notifications.

## 🌾 Features

### Customer Dashboard
- **Equipment Search**: Filter by name, category, location, price range, and availability
- **Voice Search**: Multi-language support (Hindi, Tamil, Telugu, Kannada, Malayalam)
- **Equipment Details**: View comprehensive equipment information with images and pricing
- **Booking System**: Select rental dates with interactive calendar and automatic price calculation
- **Secure Payments**: Razorpay integration for safe payment processing
- **My Bookings**: Track all bookings and payment status
- **Cost Calculator**: Labor vs Equipment Cost comparison tool
- **Offline Alerts**: Request notifications when specific equipment becomes available
- **Multi-language Interface**: Support for 6+ languages

### Technical Stack

**Frontend:**
- React 18 (Functional components and hooks)
- React Router for navigation
- Firebase Authentication
- CSS3 with responsive design
- React Icons for UI elements
- React Toastify for notifications

**Backend & Database:**
- Firebase Authentication (User login/signup)
- Cloud Firestore (NoSQL database)
- Firebase Storage (Equipment images)
- Firebase Cloud Functions (Backend logic)
- Firebase Cloud Messaging (Push notifications)
- Razorpay (Payment processing)
- Web Speech API (Voice search)

### Firestore Collections

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

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase Project setup
- Razorpay merchant account
- SMS API endpoint (for notifications)

### Installation

1. **Clone and setup the project:**
```bash
cd skit_web
npm install
```

2. **Configure Environment Variables:**
```bash
cp .env.example .env
```

Edit `.env` with your Firebase and Razorpay credentials:
```
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

3. **Setup Firebase Cloud Functions:**
```bash
cd functions
npm install
```

4. **Deploy Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

5. **Deploy Cloud Functions:**
```bash
firebase deploy --only functions
```

6. **Start the development server:**
```bash
npm start
```

The app will open at `http://localhost:3000`

## 📱 Pages & Components

### Pages
- **HomePage**: Equipment search with filters and voice search
- **EquipmentDetailsPage**: Detailed equipment view with booking
- **MyBookingsPage**: View and manage bookings
- **CostCalculatorPage**: Compare labor vs equipment costs
- **LoginPage**: User authentication
- **SignupPage**: User registration

### Reusable Components
- **EquipmentCard**: Equipment display with quick info
- **VoiceSearchInput**: Multi-language voice search
- **BookingCalendar**: Date range selection
- **RazorpayPaymentModal**: Payment processing modal
- **CostComparisonCalculator**: Labor vs equipment comparison
- **Navbar**: Navigation bar
- **ProtectedRoute**: Route protection for authenticated users

## 🔐 Authentication Flow

1. User signs up with email, password, and details
2. Firebase Authentication creates the account
3. User data stored in Firestore
4. Login persists across sessions
5. Protected routes require authentication

## 💳 Payment Flow

1. Customer selects equipment and dates
2. System calculates total price
3. Booking created in Firestore
4. Cloud Function creates Razorpay order
5. Razorpay checkout opens
6. After payment, Cloud Function verifies signature
7. Payment recorded and booking confirmed

## 🔔 Notification System

### SMS Notifications
- Triggered when requested equipment becomes available
- Cloud Function monitors equipment status changes
- Sends SMS to customer's phone number
- Updates request status to "notified"

### Push Notifications
- Firebase Cloud Messaging setup
- Requires service worker configuration
- Notification permission request on first visit

## 🎤 Voice Search

Supported languages:
- English (en-US)
- Hindi (hi-IN)
- Tamil (ta-IN)
- Telugu (te-IN)
- Kannada (kn-IN)
- Malayalam (ml-IN)

Uses Web Speech API for real-time voice recognition.

## 📊 Cost Calculator

Compare labor costs vs equipment rental:
- Input: Land size, labor wage, number of workers, equipment price, rental days
- Output: Total costs, savings, cheaper option, estimated time saved

## 📁 Project Structure

```
skit_web/
├── src/
│   ├── components/
│   │   ├── EquipmentCard
│   │   ├── VoiceSearchInput
│   │   ├── BookingCalendar
│   │   ├── RazorpayPaymentModal
│   │   ├── CostComparisonCalculator
│   │   └── Navbar
│   ├── pages/
│   │   ├── HomePage
│   │   ├── EquipmentDetailsPage
│   │   ├── MyBookingsPage
│   │   ├── CostCalculatorPage
│   │   ├── LoginPage
│   │   └── SignupPage
│   ├── services/
│   │   ├── firebase.js
│   │   ├── authService.js
│   │   ├── equipmentService.js
│   │   ├── bookingService.js
│   │   └── equipmentRequestService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── voiceSearchUtils.js
│   │   └── notificationUtils.js
│   └── App.js
├── functions/
│   ├── index.js (Cloud Functions)
│   └── package.json
├── public/
│   └── index.html
├── firebase.json
├── firestore.rules
└── package.json
```

## 🛠️ Configuration

### Firebase Setup
1. Create Firebase project at console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Create Storage bucket
5. Setup Cloud Functions (Node.js 18)
6. Enable Cloud Messaging

### Razorpay Setup
1. Create merchant account
2. Get API keys from dashboard
3. Add webhooks for payment events

### SMS API
- Configure your preferred SMS provider
- Update SMS_API_ENDPOINT and SMS_API_KEY

## 🔐 Firestore Security Rules

Rules are configured to:
- Allow users to read/write only their own data
- Allow authenticated users to read equipment
- Allow creating bookings and equipment requests
- Restrict equipment writing to admin only

## 📝 API Endpoints

### Cloud Functions

**POST /createRazorpayOrder**
- Creates a Razorpay order
- Request: `{ booking_id, amount, currency, equipment_name }`
- Response: `{ order_id, amount, currency }`

**POST /verifyPayment**
- Verifies payment signature
- Request: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- Response: `{ success: true/false }`

**POST /sendTestSMS**
- Sends test SMS
- Request: `{ phone, message }`
- Response: `{ success: true }`

## 🚨 Error Handling

- Global error catching with React error boundaries
- Toast notifications for user feedback
- Console logging for debugging
- Firestore error messages
- Payment failure handling

## 📱 Responsive Design

- Mobile-first approach
- Tailored for phones, tablets, and desktops
- Responsive grid layouts
- Touch-friendly buttons and inputs

## 🌐 Multi-language Support

- Language selection in navbar
- Voice search in multiple languages
- UI text can be internationalized
- Database stores user language preference

## 🔄 Data Synchronization

- Real-time Firestore updates
- Booking status auto-refresh
- Equipment availability polling
- Payment status synchronization

## 🚀 Deployment

### Frontend (Firebase Hosting)
```bash
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

## 📊 Performance Optimization

- Code splitting with React Router
- Lazy loading components
- Image optimization
- Firestore query optimization
- Pagination support (can be added)

## 🧪 Testing

Add test files in `src/__tests__`:
```bash
npm test
```

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Razorpay Integration](https://razorpay.com/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Follow code style guidelines

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check existing issues in the repository
2. Create a detailed bug report
3. Include environment details
4. Attach error logs

## 🎯 Future Enhancements

- [ ] Implement equipment listing feature for equipment owners
- [ ] Add rating and review system
- [ ] Real-time chat support
- [ ] Equipment price analytics
- [ ] Booking history with invoices
- [ ] Favorites/Wishlist feature
- [ ] Referral program
- [ ] Equipment damage insurance
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard

---

Built with ❤️ for Indian Farmers 🌾
