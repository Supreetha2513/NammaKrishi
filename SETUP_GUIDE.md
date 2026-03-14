# Setup Guide for NammaKrishi Marketplace

## 1. Firebase Project Setup

### Step 1.1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name: `farm-equipment-rental`
4. Enable Google Analytics (optional)
5. Create project

### Step 1.2: Enable Authentication
1. In Firebase Console → Authentication
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Save

### Step 1.3: Create Firestore Database
1. In Firebase Console → Firestore Database
2. Click "Create database"
3. Select "Start in production mode"
4. Choose region (select closest to your target users)
5. Click "Create"

### Step 1.4: Create Storage Bucket
1. In Firebase Console → Storage
2. Click "Get Started"
3. Configure security rules
4. Create bucket

### Step 1.5: Setup Cloud Functions
1. In Firebase Console → Functions
2. Upgrade to Blaze plan (pay-as-you-go)
3. Click "Get Started"

### Step 1.6: Get Firebase Config
1. Go to Project Settings (gear icon → Project Settings)
2. Copy the config object from "Your apps" section
3. Paste into `.env` file

## 2. Razorpay Setup

### Step 2.1: Create Razorpay Account
1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com/signin)
2. Sign up with email and phone
3. Verify email and phone

### Step 2.2: Get API Keys
1. Go to Settings → API Keys
2. Copy "Key ID" and "Key Secret"
3. Add to `.env`:
```
REACT_APP_RAZORPAY_KEY_ID=<Key ID>
RAZORPAY_KEY_SECRET=<Key Secret>
```

### Step 2.3: Configure Webhooks (Optional)
1. Go to Settings → Webhooks
2. Add webhook URL for payment events
3. Select events: payment.authorized, payment.failed

## 3. SMS API Setup

### Option A: Using Twilio
1. Sign up at [twilio.com](https://www.twilio.com)
2. Get Account SID and Auth Token
3. Get a Twilio phone number
4. Add to `.env`:
```
SMS_API_ENDPOINT=https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages.json
SMS_API_KEY=<AUTH_TOKEN>
```

### Option B: Using AWS SNS
1. Create AWS account
2. Setup SNS service
3. Get access key and secret
4. Configure SMS and update `.env`

### Option C: Using Exotel (India)
1. Sign up at [exotel.com](https://exotel.com)
2. Get API key
3. Add to `.env`:
```
SMS_API_ENDPOINT=https://api.exotel.com/v1/Sms/send.json
SMS_API_KEY=<API_KEY>
```

## 4. Local Development Setup

### Step 4.1: Install Dependencies
```bash
# Frontend
cd skit_web
npm install

# Cloud Functions
cd functions
npm install
```

### Step 4.2: Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_RAZORPAY_KEY_ID=
REACT_APP_API_BASE_URL=http://localhost:5000
```

### Step 4.3: Create `.env` for Functions
```bash
cd functions
cp .env.example .env
```

Add:
```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
SMS_API_KEY=
SMS_API_ENDPOINT=
FIREBASE_PROJECT_ID=farm-equipment-rental
```

### Step 4.4: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Step 4.5: Start Emulator (Optional)
```bash
firebase emulators:start
```

### Step 4.6: Start Development Server
```bash
npm start
```

## 5. Sample Data Setup

### Step 5.1: Add Equipment Data
Navigate to Firestore and create sample equipment:

```json
{
  "name": "John Deere Tractor",
  "category": "Tractor",
  "description": "Heavy-duty tractor for field preparation",
  "price_per_day": 2000,
  "price_per_hour": 250,
  "location": "Punjab",
  "availability_status": "available",
  "image_url": "https://example.com/tractor.jpg",
  "created_at": "2024-01-01"
}
```

### Step 5.2: Add User Data (Auto-created on signup)
Users are automatically created when they sign up.

## 6. Firebase Cloud Functions Deployment

### Step 6.1: Update Functions Code
Edit `functions/index.js` with proper:
- Razorpay credentials
- SMS API configuration
- Error handling

### Step 6.2: Add Environment Variables
In Firebase Console → Functions:
1. Go to your function
2. Click "Edit runtime settings"
3. Add environment variables:
   - RAZORPAY_KEY_SECRET
   - SMS_API_KEY
   - SMS_API_ENDPOINT

### Step 6.3: Deploy Functions
```bash
firebase deploy --only functions
```

### Step 6.4: Verify Deployment
```bash
firebase functions:list
```

## 7. Production Deployment

### Step 7.1: Build Frontend
```bash
npm run build
```

### Step 7.2: Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### Step 7.3: Enable CORS for Functions
Functions automatically handle CORS, but ensure:
- API_BASE_URL points to your functions endpoint
- Functions have proper CORS headers

### Step 7.4: Setup Custom Domain (Optional)
1. In Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow DNS setup instructions

## 8. Testing Checklist

- [ ] User can sign up and login
- [ ] Equipment displays correctly
- [ ] Voice search works in multiple languages
- [ ] Booking creation works
- [ ] Razorpay payment modal opens
- [ ] Cost calculator functions correctly
- [ ] SMS notifications send (after equipment status change)
- [ ] Equipment requests are created
- [ ] My Bookings page shows all bookings
- [ ] Navbar authentication state updates

## 9. Security Checklist

- [ ] Firebase security rules deployed
- [ ] API keys restricted to domain
- [ ] Razorpay key ID is public only
- [ ] Razorpay key secret kept secure
- [ ] SMS API credentials in environment only
- [ ] HTTPS enabled for production
- [ ] CORS properly configured
- [ ] Input validation on frontend and backend

## 10. Monitoring & Debugging

### Firebase Console
- Monitor function executions
- View Firestore data
- Check authentication logs
- Monitor storage usage

### Razorpay Dashboard
- Track payment transactions
- Monitor failed payments
- Review webhook events

### Browser DevTools
- Check console for errors
- Monitor network requests
- Debug Firebase calls

## 11. Common Issues & Solutions

### Issue: "Firebase config not found"
- Ensure `.env` file exists
- Check environment variable names
- Restart development server

### Issue: "Razorpay payment fails"
- Verify API keys
- Check if Razorpay is in test mode
- Ensure payment amount is in paise

### Issue: "SMS not sending"
- Check SMS API key
- Verify phone number format
- Check SMS API endpoint
- Review SMS API logs

### Issue: "Cloud Functions not deploying"
- Check Node.js version (must be 18+)
- Verify firebase account is Blaze plan
- Check for syntax errors in functions code

## 12. Performance Optimization

1. Enable Firestore caching
2. Optimize images with Firebase Storage CDN
3. Use Cloud Functions for heavy operations
4. Implement pagination for equipment lists
5. Add Progressive Web App (PWA) support

## 13. Backup & Recovery

1. Regular Firestore backups (enable auto-backup)
2. Setup Cloud Functions recovery
3. Document environment variables securely
4. Maintain database documentation

## 14. Support & Resources

- Firebase Docs: https://firebase.google.com/docs
- Razorpay Docs: https://razorpay.com/docs
- React Docs: https://react.dev
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

**Next Steps:**
1. Complete all setup steps above
2. Run through testing checklist
3. Deploy to production
4. Monitor and optimize
