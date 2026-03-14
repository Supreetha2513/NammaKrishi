# NammaKrishi Marketplace - Complete Project Structure

## 📁 File Organization

```
d:\skit_hackathon\skit_web/
│
├── 📄 package.json                    # Frontend dependencies and scripts
├── 📄 tsconfig.json                   # TypeScript configuration
├── 📄 .env.example                    # Environment variables template
├── 📄 .gitignore                      # Git ignore rules
│
├── 📚 Documentation Files
│   ├── 📄 README.md                   # Complete project documentation
│   ├── 📄 QUICK_START.md              # 5-minute quick start guide
│   ├── 📄 SETUP_GUIDE.md              # Detailed setup instructions
│   ├── 📄 API_REFERENCE.md            # Cloud Functions API docs
│   ├── 📄 DEVELOPMENT.md              # Development standards
│   └── 📄 PROJECT_SUMMARY.md          # Project completion summary
│
├── 📂 public/                         # Static files
│   ├── 📄 index.html                  # Main HTML file
│   └── 📄 firebase-messaging-sw.js    # Service worker for FCM
│
├── 📂 src/                            # React source code
│   ├── 📄 index.js                    # React entry point
│   ├── 📄 index.css                   # Global styles
│   ├── 📄 App.js                      # Main app component
│   ├── 📄 App.css                     # App styles
│   │
│   ├── 📂 pages/                      # Page components (6 pages)
│   │   ├── 📄 HomePage.js             # Equipment search & browse
│   │   ├── 📄 HomePage.css
│   │   ├── 📄 EquipmentDetailsPage.js # Equipment details & booking
│   │   ├── 📄 EquipmentDetailsPage.css
│   │   ├── 📄 MyBookingsPage.js       # Bookings & requests
│   │   ├── 📄 MyBookingsPage.css
│   │   ├── 📄 CostCalculatorPage.js   # Labor vs Equipment tool
│   │   ├── 📄 CostCalculatorPage.css
│   │   ├── 📄 LoginPage.js            # User login
│   │   ├── 📄 SignupPage.js           # User signup
│   │   ├── 📄 AuthPage.css            # Auth pages styles
│   │
│   ├── 📂 components/                 # Reusable components (6 components)
│   │   ├── 📄 EquipmentCard.js        # Equipment display card
│   │   ├── 📄 EquipmentCard.css
│   │   ├── 📄 VoiceSearchInput.js     # Multi-language voice search
│   │   ├── 📄 VoiceSearchInput.css
│   │   ├── 📄 BookingCalendar.js      # Date range selector
│   │   ├── 📄 BookingCalendar.css
│   │   ├── 📄 RazorpayPaymentModal.js # Payment modal
│   │   ├── 📄 RazorpayPaymentModal.css
│   │   ├── 📄 CostComparisonCalculator.js # Cost calculator
│   │   ├── 📄 CostComparisonCalculator.css
│   │   ├── 📄 Navbar.js               # Navigation bar
│   │   ├── 📄 Navbar.css
│   │   ├── 📄 ProtectedRoute.js       # Auth protection HOC
│   │
│   ├── 📂 services/                   # Business logic (5 services)
│   │   ├── 📄 firebase.js             # Firebase initialization
│   │   ├── 📄 authService.js          # Authentication logic
│   │   ├── 📄 equipmentService.js     # Equipment queries
│   │   ├── 📄 bookingService.js       # Bookings & payments
│   │   └── 📄 equipmentRequestService.js # Equipment requests
│   │
│   ├── 📂 hooks/                      # Custom React hooks (2 hooks)
│   │   ├── 📄 useAuth.js              # Authentication hook
│   │   └── 📄 useFetch.js             # Generic data fetching
│   │
│   └── 📂 utils/                      # Utility functions (3 files)
│       ├── 📄 helpers.js              # Price calculations
│       ├── 📄 voiceSearchUtils.js     # Voice search utilities
│       └── 📄 notificationUtils.js    # Notification management
│
├── 📂 functions/                      # Cloud Functions (Backend)
│   ├── 📄 index.js                    # Cloud Functions logic
│   │   ├── createRazorpayOrder()      # Payment order creation
│   │   ├── verifyPayment()            # Payment verification
│   │   ├── notifyEquipmentAvailable() # SMS notifications
│   │   ├── sendTestSMS()              # Test SMS endpoint
│   │   └── cleanupPendingBookings()   # Scheduled cleanup
│   ├── 📄 package.json                # Functions dependencies
│   └── 📄 .env.example                # Functions env template
│
├── 📄 firebase.json                   # Firebase configuration
└── 📄 firestore.rules                 # Firestore security rules
```

---

## 📑 File Descriptions

### Configuration Files
| File | Purpose |
|------|---------|
| package.json | NPM dependencies, scripts, build config |
| .env.example | Template for environment variables |
| firebase.json | Firebase project configuration |
| firestore.rules | Firestore security and access rules |
| tsconfig.json | TypeScript configuration (for future) |
| .gitignore | Git version control ignores |

### Documentation Files
| File | Purpose |
|------|---------|
| README.md | Complete project documentation |
| QUICK_START.md | Quick setup and usage guide |
| SETUP_GUIDE.md | Step-by-step Firebase, Razorpay setup |
| API_REFERENCE.md | Cloud Functions API endpoints |
| DEVELOPMENT.md | Code style, standards, guidelines |
| PROJECT_SUMMARY.md | Project completion summary |

### React Source Files

#### Pages (6 pages, 12 files)
| Page | Purpose |
|------|---------|
| HomePage | Equipment search with filters and voice search |
| EquipmentDetailsPage | Equipment details, calendar, booking |
| MyBookingsPage | Customer bookings and equipment requests |
| CostCalculatorPage | Labor vs equipment cost comparison |
| LoginPage | User login with Firebase Auth |
| SignupPage | User registration with profile |

#### Components (6 reusable, 12 files)
| Component | Purpose | Extends |
|-----------|---------|---------|
| EquipmentCard | Equipment display card | Cards throughout app |
| VoiceSearchInput | Multi-language voice search | HomePage, all search areas |
| BookingCalendar | Date range selection | EquipmentDetailsPage |
| RazorpayPaymentModal | Payment checkout modal | EquipmentDetailsPage |
| CostComparisonCalculator | Cost comparison tool | CostCalculatorPage |
| Navbar | Navigation & authentication | App-wide |

#### Services (5 services)
| Service | Methods | Used By |
|---------|---------|---------|
| authService | signup, login, logout, getUserData | All auth operations |
| equipmentService | searchEquipment, getEquipmentById, getAllEquipment | HomePage, Details |
| bookingService | createBooking, getBookings, createRazorpayOrder, verifyPayment | Booking flow |
| equipmentRequestService | createRequest, getRequests | MyBookingsPage |
| firebase | Firebase initialization | All services |

#### Hooks (2 hooks)
| Hook | Purpose | Used By |
|------|---------|---------|
| useAuth | Auth state management | All auth-related pages |
| useFetch | Generic data fetching | Services, Pages |

#### Utilities (3 utilities)
| Utility | Functions | Used By |
|---------|-----------|---------|
| helpers | Price calc, date format, cost compare | All pages |
| voiceSearchUtils | Voice recognition, multi-lang | VoiceSearchInput |
| notificationUtils | FCM, push notifications, SMS | Services |

### Backend Files

#### Cloud Functions
| Function | Purpose | Triggers |
|----------|---------|----------|
| createRazorpayOrder | Creates payment order | HTTP POST |
| verifyPayment | Validates & confirms payment | HTTP POST |
| notifyEquipmentAvailable | Sends SMS when equipment available | Firestore update |
| sendTestSMS | Testing SMS functionality | HTTP POST |
| cleanupPendingBookings | Removes old pending bookings | Scheduled daily |

---

## 🎯 Feature Map (File Locations)

### User Authentication
- **Files**: LoginPage.js, SignupPage.js, authService.js, useAuth.js
- **Database**: users collection
- **Features**: Email/password, multi-language preference

### Equipment Search
- **Files**: HomePage.js, EquipmentCard.js, equipmentService.js
- **Database**: equipment collection
- **Features**: Multi-filter search, voice search, real-time updates

### Voice Search (Multi-Language)
- **Files**: VoiceSearchInput.js, voiceSearchUtils.js
- **Languages**: English, Hindi, Tamil, Telugu, Kannada, Malayalam
- **Features**: Real-time transcription, language switching

### Equipment Booking
- **Files**: EquipmentDetailsPage.js, BookingCalendar.js, bookingService.js
- **Database**: bookings collection
- **Features**: Date selection, price calculation, booking creation

### Payment Processing
- **Files**: RazorpayPaymentModal.js, bookingService.js, functions/index.js
- **Database**: payments collection
- **Features**: Order creation, signature verification, status update

### SMS Notifications
- **Files**: functions/index.js, equipmentRequestService.js
- **Database**: equipment_requests collection
- **Features**: Automatic SMS on availability, request tracking

### Cost Calculator
- **Files**: CostCalculatorPage.js, CostComparisonCalculator.js, helpers.js
- **Features**: Labor vs equipment comparison, savings calculation

### Offline Alerts
- **Files**: MyBookingsPage.js, equipmentRequestService.js, functions/index.js
- **Database**: equipment_requests collection
- **Features**: Request creation, SMS notification on match

---

## 📊 Database Collections

### users/
```
├── {userId}
│   ├── name: string
│   ├── email: string
│   ├── phone: string
│   ├── language_preference: string
│   └── created_at: timestamp
```

### equipment/
```
├── {equipmentId}
│   ├── name: string
│   ├── category: string
│   ├── description: string
│   ├── price_per_day: number
│   ├── price_per_hour: number
│   ├── location: string
│   ├── availability_status: string
│   ├── image_url: string
│   └── created_at: timestamp
```

### bookings/
```
├── {bookingId}
│   ├── equipment_id: string
│   ├── customer_id: string
│   ├── start_date: date
│   ├── end_date: date
│   ├── total_price: number
│   ├── booking_status: string
│   ├── payment_status: string
│   └── created_at: timestamp
```

### payments/
```
├── {paymentId}
│   ├── booking_id: string
│   ├── razorpay_order_id: string
│   ├── razorpay_payment_id: string
│   ├── razorpay_signature: string
│   ├── payment_status: string
│   ├── amount: number
│   └── created_at: timestamp
```

### equipment_requests/
```
├── {requestId}
│   ├── customer_id: string
│   ├── equipment_name: string
│   ├── location: string
│   ├── booking_status: string
│   └── created_at: timestamp
```

---

## 🚀 Total Files Created

### Source Code Files: 30+
- React Components: 6 pages (12 files)
- Reusable Components: 6 components (12 files)
- Services: 5 services (5 files)
- Hooks: 2 hooks (2 files)
- Utilities: 3 utilities (3 files)
- App: 2 files (App.js, App.css)
- Entry: 2 files (index.js, index.css)

### Configuration Files: 8+
- package.json, .env.example, .gitignore
- firebase.json, firestore.rules
- tsconfig.json, .firebaserc (auto-created)
- functions/.env.example

### Documentation Files: 6
- README.md, QUICK_START.md, SETUP_GUIDE.md
- API_REFERENCE.md, DEVELOPMENT.md, PROJECT_SUMMARY.md

### Backend Files: 2
- functions/index.js (Cloud Functions)
- functions/package.json

### Public Files: 2
- public/index.html
- public/firebase-messaging-sw.js

**Total: 50+ files created and configured**

---

## 🔗 Dependencies Overview

### Frontend Dependencies (package.json)
- react: 18.2.0 - UI framework
- react-dom: 18.2.0 - React DOM
- react-router-dom: 6.15.0 - Routing
- firebase: 10.5.0 - Backend services
- axios: 1.6.0 - HTTP requests
- razorpay: 2.9.2 - Payment gateway
- react-calendar: 4.2.1 - Calendar widget
- date-fns: 2.30.0 - Date utilities
- react-icons: 4.12.0 - Icon library
- react-toastify: 9.1.3 - Notifications

### Backend Dependencies (functions/package.json)
- firebase-admin: 11.5.0 - Firebase admin SDK
- firebase-functions: 4.3.1 - Cloud Functions
- cors: 2.8.5 - CORS handling
- axios: 1.6.0 - HTTP requests
- razorpay: 2.9.2 - Razorpay SDK

---

## 📱 Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support (iOS 12+)
- Edge: Full support
- Mobile browsers: Optimized responsive design

---

## ✨ Next Steps

1. **Read** QUICK_START.md for immediate setup
2. **Configure** .env with Firebase and Razorpay credentials
3. **Install** dependencies: `npm install`
4. **Run** development server: `npm start`
5. **Deploy** to Firebase: `firebase deploy`

---

This complete project structure provides everything needed for a production-ready NammaKrishi Marketplace!

🌾 **Happy farming!**
