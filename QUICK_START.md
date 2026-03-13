# Quick Start Guide - Farm Equipment Rental Marketplace

## ⚡ 5-Minute Setup

### 1. Clone Repository
```bash
cd d:\skit_hackathon\skit_web
npm install
```

### 2. Configure Firebase
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Firebase credentials from Firebase Console
```

### 3. Configure Razorpay
```bash
# Add your Razorpay Key ID to .env
REACT_APP_RAZORPAY_KEY_ID=<Your Key ID>
```

### 4. Start Development Server
```bash
npm start
```

Visit `http://localhost:3000`

---

## 🎯 What's Included

### ✅ Frontend (React)
- **Pages**: Home, Equipment Details, My Bookings, Cost Calculator, Login, Signup
- **Components**: Equipment Card, Voice Search, Booking Calendar, Payment Modal, Cost Calculator
- **Features**: Multi-language search, Real-time updates, Responsive design

### ✅ Backend (Firebase)
- **Authentication**: Email/password with providers support
- **Database**: Firestore with pre-configured collections
- **Storage**: Images with CDN
- **Cloud Functions**: Payment & SMS integration
- **Security Rules**: Pre-configured security

### ✅ Payment Processing
- **Razorpay Integration**: Secure checkout
- **Order Management**: Auto-created orders
- **Payment Verification**: Signature validation

### ✅ Notifications
- **SMS Alerts**: When equipment becomes available
- **Push Notifications**: Firebase Cloud Messaging setup
- **Email Ready**: Can be extended

### ✅ Multi-Language Support
- English, Hindi, Tamil, Telugu, Kannada, Malayalam
- Voice search in all languages
- Language preference saved per user

---

## 📁 Project Files Overview

```
src/
├── App.js                          # Main app routing
├── components/
│   ├── EquipmentCard.js           # Equipment display
│   ├── VoiceSearchInput.js         # Voice search (multi-lang)
│   ├── BookingCalendar.js          # Date selection
│   ├── RazorpayPaymentModal.js    # Payment processing
│   ├── CostComparisonCalculator.js # Labor vs Equipment
│   ├── Navbar.js                   # Navigation
│   └── ProtectedRoute.js           # Auth guard
├── pages/
│   ├── HomePage.js                # Search & browse
│   ├── EquipmentDetailsPage.js    # Equipment booking
│   ├── MyBookingsPage.js           # Bookings & requests
│   ├── CostCalculatorPage.js       # Cost tool
│   ├── LoginPage.js                # Sign in
│   └── SignupPage.js               # Register
├── services/
│   ├── firebase.js                 # Firebase setup
│   ├── authService.js              # Auth logic
│   ├── equipmentService.js         # Equipment queries
│   ├── bookingService.js           # Bookings & payments
│   └── equipmentRequestService.js  # Equipment requests
├── hooks/
│   ├── useAuth.js                  # Auth state
│   └── useFetch.js                 # Data fetching
└── utils/
    ├── helpers.js                  # Price calculations
    ├── voiceSearchUtils.js         # Voice recognition
    └── notificationUtils.js        # Notifications

functions/
└── index.js                        # Cloud Functions
    - createRazorpayOrder()
    - verifyPayment()
    - notifyEquipmentAvailable()
```

---

## 🚀 Key Features Explained

### 1. Equipment Search
- Filter by category, location, price
- Real-time search as you type
- Voice search with accent support

```javascript
// In HomePage.js
const handleSearch = (text) => {
  setSearchText(text);
  applyFilters(equipment, text, ...);
};
```

### 2. Booking Flow
1. Select equipment → Choose dates → Confirm price → Pay → Done

```javascript
// In EquipmentDetailsPage.js
const handleBooking = async () => {
  // Create booking in Firestore
  const booking = await BookingService.createBooking(bookingData);
  
  // Create Razorpay order
  const order = await BookingService.createRazorpayOrder({...});
  
  // Open payment modal
  setShowPaymentModal(true);
};
```

### 3. Voice Search (Multi-Language)
Supports: English, Hindi, Tamil, Telugu, Kannada, Malayalam

```javascript
// Uses Web Speech API
const handleVoiceSearch = () => {
  VoiceSearchService.startListening(language, (transcript) => {
    setSearchText(transcript);
    onSearch(transcript);
  });
};
```

### 4. Payment Processing
- Razorpay integration for secure payments
- Cloud Function creates orders
- Signature verification on backend

### 5. Offline Equipment Alert
- User creates request when equipment unavailable
- Cloud Function monitors status changes
- When available, SMS sent to user with details

---

## 🔧 Configuration Files

### .env (Frontend)
```
REACT_APP_FIREBASE_API_KEY=abc123
REACT_APP_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=project-id
...
REACT_APP_RAZORPAY_KEY_ID=key_xyz
```

### functions/.env (Backend)
```
RAZORPAY_KEY_SECRET=key_secret
SMS_API_KEY=sms_key
SMS_API_ENDPOINT=https://api.provider.com/sms
```

---

## 📊 Database Schema

### Equipment Document
```json
{
  "id": "tractor_001",
  "name": "John Deere Tractor",
  "category": "Tractor",
  "description": "Heavy-duty 50HP",
  "price_per_day": 2000,
  "price_per_hour": 250,
  "location": "Punjab",
  "availability_status": "available",
  "image_url": "https://...",
  "created_at": "2024-01-01"
}
```

### Booking Document
```json
{
  "id": "booking_001",
  "equipment_id": "tractor_001",
  "customer_id": "user_123",
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "total_price": 12000,
  "booking_status": "confirmed",
  "payment_status": "success",
  "created_at": "2024-01-10"
}
```

---

## 🧪 Testing the App

### 1. Create Test Account
- Click "Sign Up"
- Register with test email
- Verify account created in Firebase Console

### 2. Check Equipment
- Should see sample equipment on home page
- Search works with all filters
- Try voice search

### 3. Test Booking
- Click "Select" on any equipment
- Choose dates on calendar
- Review booking summary
- (Use Razorpay test cards for payment testing)

### 4. Verify My Bookings
- Bookings shown in "My Bookings"
- Status updates reflected
- Equipment details populated

---

## 🐛 Common Issues & Fixes

### Issue: "Firebase config not found"
```bash
# Make sure .env exists and has correct variable names
echo "REACT_APP_FIREBASE_API_KEY=..." > .env
```

### Issue: "Cannot find module 'react'"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Razorpay key not found"
```bash
# Check .env has REACT_APP_RAZORPAY_KEY_ID
# Restart dev server after .env changes
npm start
```

### Issue: "Firestore rules blocked"
```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules
```

---

## 🎓 Learn More

### Complete Guides
- [README.md](./README.md) - Full documentation
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development standards

### Quick Links
- Firebase Console: https://console.firebase.google.com
- Razorpay Dashboard: https://dashboard.razorpay.com
- React Docs: https://react.dev
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

## 📦 Deployment

### Deploy to Firebase
```bash
# Build frontend
npm run build

# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting      # Frontend
firebase deploy --only functions    # Cloud Functions
firebase deploy --only firestore    # Database rules
```

### Deploy Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

---

## 🎯 Next Steps

1. **Setup Firebase Project** (if not done)
   - Create project at console.firebase.google.com
   - Add credentials to .env

2. **Configure Razorpay** (if not done)
   - Get API keys
   - Add to .env

3. **Run Locally**
   ```bash
   npm install
   npm start
   ```

4. **Test Features**
   - Sign up and login
   - Search equipment
   - Try voice search
   - Create booking
   - Test payment flow

5. **Deploy**
   ```bash
   firebase deploy
   ```

---

## 💡 Tips & Tricks

### Development
- Use React DevTools browser extension
- Check Firebase Console for real-time updates
- Use Chrome DevTools Network tab to debug API calls
- Enable Firestore emulator for local development

### Performance
- Voice search works best with short queries
- Equipment cards are lazy-loaded
- Images can be optimized before upload
- Firestore queries are indexed for speed

### User Experience
- Mobile-optimized interface
- Dark mode ready (can be extended)
- Progressive Web App capable
- Offline capabilities (can be extended)

---

## 🆘 Need Help?

1. Check error messages in browser console
2. Review Firestore logs in Firebase Console
3. Check Cloud Functions logs for backend errors
4. Verify API credentials in .env
5. Restart dev server after configuration changes

---

## 🎉 You're All Set!

Your Farm Equipment Rental Marketplace is ready to use. Start the server and explore all the features!

```bash
npm start
```

Happy coding! 🌾
