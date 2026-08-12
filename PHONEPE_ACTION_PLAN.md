# PhonePe Android SDK - Implementation Action Plan

## Current Status

You have:
- ✅ Basic payment flow implemented
- ✅ Backend webhook structure ready
- ✅ Frontend UI created
- ✅ Database setup complete

Now you need:
- ⏳ Official PhonePe Android SDK integration
- ⏳ Backend API updates (Auth Token, Create Order, Order Status)
- ⏳ Native React Native bridge module
- ⏳ Full end-to-end testing

---

## 🎯 3-Phase Implementation Plan

### Phase 1: Backend API Updates (1-2 days)

**Files to Update:**
- `backend/routes/phonepe-payment.js`
- `backend/.env` (already updated)
- `backend/index.js` (already updated)

**What to Add:**

1. **Auth Token Endpoint**
```javascript
POST /api/phonepe/auth-token
Purpose: Get OAuth token from PhonePe
Time: 1 hour
```

2. **Create Order Endpoint**
```javascript
POST /api/phonepe/create-order
Purpose: Create payment order on PhonePe
Time: 2 hours
```

3. **Order Status Endpoint**
```javascript
GET /api/phonepe/order-status/:merchantOrderId
Purpose: Check payment status
Time: 1 hour
```

4. **Update Webhook**
```javascript
POST /api/phonepe/callback
Current: Basic version
Updated: Full PhonePe API integration
Time: 1 hour
```

**Testing:** Use Postman with sandbox credentials

---

### Phase 2: Frontend Service Updates (4-6 hours)

**Files to Update:**
- `newtaxi/apps/unified/src/services/paymentService.js`

**What to Change:**

1. **Add Auth Flow**
```javascript
- getPhonePeAuthToken()    // New
- createPhonePeOrder()     // Update
- verifyPhonePePayment()   // New
```

2. **Update initiate Flow**
```javascript
OLD: Direct signature generation
NEW: Get token → Create order → Pass to SDK
```

3. **Add Status Polling**
```javascript
- Poll /api/phonepe/order-status/:id
- Check payment status
- Update UI accordingly
```

**Time:** 4-6 hours

---

### Phase 3: Native Module Integration (2-3 days)

**Two Options:**

**Option A: Expo Config Plugin (Easier)**
- Create Expo plugin for PhonePe SDK
- Stay with Expo managed workflow
- Limited but functional
- Time: 1-2 days
- Complexity: Medium

**Option B: Bare React Native (Full Features)**
- Eject from Expo
- Add native Android SDK
- Full native integration
- Time: 2-3 days
- Complexity: High
- Benefit: Full PhonePe features

**Recommended:** Option A (stay with Expo) + Bridge to native when needed

---

## 📋 Detailed Checklist

### Week 1: Backend Setup

- [ ] Create `POST /api/phonepe/auth-token` endpoint
  - [ ] Call PhonePe Authorization API
  - [ ] Cache token with 10-min expiry
  - [ ] Return to frontend
  - [ ] Test with Postman

- [ ] Create `POST /api/phonepe/create-order` endpoint
  - [ ] Receive userId, amount, merchantOrderId
  - [ ] Call PhonePe Create Order API
  - [ ] Generate signature
  - [ ] Save to database
  - [ ] Return order data

- [ ] Create `GET /api/phonepe/order-status/:id` endpoint
  - [ ] Query PhonePe Order Status API
  - [ ] Update database
  - [ ] Return status to frontend

- [ ] Update `POST /api/phonepe/callback` webhook
  - [ ] Verify signature
  - [ ] Update transaction status
  - [ ] Credit wallet if SUCCESS
  - [ ] Log all events

- [ ] Write test script for all endpoints

### Week 2: Frontend Updates

- [ ] Update paymentService.js
  - [ ] Add getPhonePeAuthToken()
  - [ ] Update createPhonePeOrder()
  - [ ] Add verifyPhonePePayment()
  - [ ] Add status polling

- [ ] Update PhonePePaymentModal.js
  - [ ] Add auth token flow
  - [ ] Add order creation
  - [ ] Add status checking
  - [ ] Update UI states

- [ ] Test payment flow end-to-end
  - [ ] UI → Backend → PhonePe API
  - [ ] Error handling
  - [ ] Status updates

### Week 3: Native Integration

- [ ] Research Expo Config Plugin approach
  - [ ] Study PhonePe Android SDK
  - [ ] Plan native bridge

- [ ] Create native module
  - [ ] Android SDK setup
  - [ ] Native bridge code
  - [ ] Event handling

- [ ] Integrate with React Native
  - [ ] Call from JavaScript
  - [ ] Handle callbacks
  - [ ] Error propagation

- [ ] Full end-to-end testing
  - [ ] Sandbox transactions
  - [ ] Error scenarios
  - [ ] Production readiness

---

## 🔧 Technical Requirements

### Backend
- Node.js (already have)
- Express (already have)
- Crypto for signatures
- HTTP client for API calls

### Frontend
- React Native (already have)
- Expo (already have)
- Native bridge module (to create)

### Android
- PhonePe Android SDK
- Android 5.0+ (API 21+)
- Native code support

---

## 💰 Cost Considerations

- **PhonePe SDK:** Free (provided by PhonePe)
- **Transaction Fees:** 2-3% (standard)
- **Development Time:** ~1 week
- **Testing:** Sandbox is free

---

## 📊 Success Criteria

✅ **Backend:**
- Auth token endpoint working
- Order creation successful
- Status checks accurate
- Webhook receives callbacks
- Signature verification correct

✅ **Frontend:**
- Payment initiated successfully
- SDK opens app-native checkout
- Status updates in real-time
- Error messages clear
- Wallet credits instantly

✅ **Integration:**
- End-to-end payment works
- All payment methods functional
- Error handling comprehensive
- Production ready

---

## ⏱️ Timeline

**Best Case (Everything smooth):** 1 week
**Realistic:** 2 weeks
**With Issues:** 3 weeks

---

## 🎯 Recommended Approach

1. **Start with backend APIs** (easier to test)
2. **Then update frontend service** (build on backend)
3. **Finally add native module** (uses both above)

This way you can test each layer independently before integration.

---

## 📞 Next Steps

1. **Review** PhonePe Android SDK docs (you have it)
2. **Decide** on Expo Plugin vs Bare React Native
3. **Start** Phase 1 (Backend APIs)
4. **Test** with Postman
5. **Move to** Phase 2 (Frontend)
6. **Finally** Phase 3 (Native)

---

## 🔗 Useful Links

- PhonePe Business: https://www.phonepe.com/business
- Documentation: (shared in your message)
- Sandbox API: https://api-preprod.phonepe.com
- Production API: https://api.phonepe.com

---

**Current:** Basic integration complete  
**Next:** Official SDK integration (this plan)  
**Result:** Production-ready PhonePe payments

---

Let me know when you're ready to start Phase 1! 🚀
