# PhonePe Android SDK Integration for React Native Expo

## 📱 Overview

PhonePe provides an official Android SDK for seamless payment integration. Since your app is built with React Native Expo, we need to:

1. Create a native Android module for PhonePe SDK
2. Bridge it with React Native JavaScript code
3. Integrate into your existing payment flow

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│     React Native (Expo)             │
│     PaymentScreen                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PhonePe React Native Module        │
│  (Native Bridge)                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PhonePe Android SDK                │
│  - Payment Processing               │
│  - UPI, Cards, Net Banking          │
│  - App-native checkout              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PhonePe Backend                    │
│  - Sandbox: api-preprod.phonepe.com │
│  - Production: api.phonepe.com      │
└─────────────────────────────────────┘
```

---

## 📋 Payment Flow (Using Official SDK)

```
1. Driver: "Add Money ₹100"
   ↓
2. React Native calls backend: /api/phonepe/initiate
   ↓
3. Backend:
   - Get Auth Token (Authorization API)
   - Create Payment Order (Create Order API)
   - Generate Signature
   - Return to frontend
   ↓
4. React Native passes to PhonePe SDK
   ↓
5. PhonePe SDK opens app-native checkout
   ↓
6. Driver completes UPI/Card/Net Banking payment
   ↓
7. PhonePe SDK returns to your app with status
   ↓
8. React Native verifies with backend
   ↓
9. Backend confirms via Webhook or Order Status API
   ↓
10. Wallet credited automatically
```

---

## 🔧 Backend API Changes Required

Your current backend needs updates to match PhonePe SDK flow:

### 1. Authorization API - Get Auth Token

```javascript
POST /v1/oauth/token
Body: {
  grantType: "merchant",
  merchantId: "M18UH4EERGY0",
  merchantSecret: "ba33ba9c-a4fc-4bea-bf2b-ble1f7c05fac"
}

Response: {
  accessToken: "xxx",
  expiresIn: 600,
  tokenType: "Bearer"
}
```

### 2. Create Order API - Create Payment Order

```javascript
POST /checkout/v2/sdk/order
Headers: {
  Authorization: "Bearer {accessToken}",
  X-VERIFY: "signature"
}
Body: {
  merchantId: "M18UH4EERGY0",
  merchantOrderId: "ORDER_" + Date.now(),
  amount: 10000, // in paise (₹100 = 10000 paise)
  currencyCode: "INR",
  customerIdentifier: "userId",
  successCallbackUrl: "phonepe://success",
  failureCallbackUrl: "phonepe://failure",
  redirectUrl: "app://payment",
  redirectMode: "ON_MOBILE",
  paymentInstrument: {
    type: "UPI",
    targetApp: "ANY"
  },
  deviceContext: {
    deviceOS: "ANDROID",
    ipAddress: "192.168.1.x"
  }
}

Response: {
  success: true,
  code: "PAYMENT_INITIATED",
  data: {
    instrumentResponseCode: "SUCCESS",
    transactionId: "PG-xxx"
  }
}
```

### 3. Order Status API - Verify Payment

```javascript
GET /checkout/v2/order/{merchantOrderId}/status
Headers: {
  Authorization: "Bearer {accessToken}",
  X-VERIFY: "signature"
}

Response: {
  success: true,
  code: "PAYMENT_SUCCESS",
  data: {
    merchantOrderId: "ORDER_xxx",
    transactionId: "PG-xxx",
    amount: 10000,
    state: "COMPLETED",
    responseCode: "SUCCESS"
  }
}
```

---

## 📦 React Native Implementation

### Step 1: Create Native Bridge Module

Since Expo doesn't support native modules directly, you have two options:

**Option A: Use Bare React Native (Full Native Support)**
- Eject from Expo
- Add PhonePe Android SDK
- Full native integration

**Option B: Use Expo Config Plugin (Recommended)**
- Stay with Expo
- Create config plugin for PhonePe
- Limited but functional

---

## 🎯 Updated Frontend Flow

### Updated paymentService.js

```javascript
import { API_CONFIG } from '../constants';

/**
 * PhonePe Payment Service - Using Official Android SDK
 */

/**
 * Step 1: Request Auth Token from Backend
 */
export const getPhonePeAuthToken = async () => {
  try {
    const response = await fetch(`${API_CONFIG.SMS_API_URL}/api/phonepe/auth-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    return data.data.accessToken;
  } catch (error) {
    console.error('❌ Auth token error:', error.message);
    throw error;
  }
};

/**
 * Step 2: Create Payment Order
 */
export const createPhonePeOrder = async (userId, amount, authToken) => {
  try {
    const merchantOrderId = `ORDER_${userId}_${Date.now()}`;
    
    const response = await fetch(`${API_CONFIG.SMS_API_URL}/api/phonepe/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        userId,
        amount,
        merchantOrderId,
        userType: 'driver'
      })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    return {
      merchantOrderId,
      transactionId: data.data.transactionId,
      orderData: data.data
    };
  } catch (error) {
    console.error('❌ Create order error:', error.message);
    throw error;
  }
};

/**
 * Step 3: Initiate PhonePe Payment (Calls Android SDK)
 */
export const initiatePhonePePayment = async (orderData) => {
  try {
    // This would be called from native code
    // For now, return order data to pass to native module
    return {
      success: true,
      data: orderData
    };
  } catch (error) {
    console.error('❌ Payment initiation error:', error.message);
    throw error;
  }
};

/**
 * Step 4: Verify Payment Status
 */
export const verifyPhonePePayment = async (merchantOrderId, authToken) => {
  try {
    const response = await fetch(
      `${API_CONFIG.SMS_API_URL}/api/phonepe/order-status/${merchantOrderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    return {
      success: true,
      status: data.data.state,
      transactionId: data.data.transactionId
    };
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    throw error;
  }
};

/**
 * Complete Payment Flow
 */
export const initiateDeposit = async (depositData) => {
  try {
    const { userId, amount } = depositData;
    
    // Step 1: Get auth token
    console.log('📱 Getting auth token...');
    const authToken = await getPhonePeAuthToken();
    
    // Step 2: Create order
    console.log('📱 Creating payment order...');
    const orderData = await createPhonePeOrder(userId, amount, authToken);
    
    // Step 3: Return for SDK to process
    console.log('📱 Passing to PhonePe Android SDK...');
    return {
      success: true,
      pending: true,
      data: {
        merchantOrderId: orderData.merchantOrderId,
        authToken,
        orderData: orderData.orderData
      }
    };
  } catch (error) {
    console.error('❌ Deposit error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};
```

---

## 🔌 Backend Updates Required

### New Backend Endpoints

```javascript
// backend/routes/phonepe-payment.js

/**
 * 1. Get Auth Token
 */
router.post('/auth-token', async (req, res) => {
  try {
    const tokenResponse = await fetch(
      `${PHONEPE_AUTH_URL}/v1/oauth/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantType: 'merchant',
          merchantId: process.env.PHONEPE_MERCHANT_ID,
          merchantSecret: process.env.PHONEPE_API_KEY
        })
      }
    );
    
    const tokenData = await tokenResponse.json();
    res.json({ success: true, data: tokenData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Create Payment Order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { userId, amount, merchantOrderId, userType } = req.body;
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    
    // Create order with PhonePe API
    const orderResponse = await fetch(
      `${PHONEPE_API_URL}/checkout/v2/sdk/order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-VERIFY': generateSignature(orderPayload)
        },
        body: JSON.stringify(orderPayload)
      }
    );
    
    const orderData = await orderResponse.json();
    
    // Save to database
    await savePhonePeTransaction(userId, amount, merchantOrderId, userType);
    
    res.json({ success: true, data: orderData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Get Order Status
 */
router.get('/order-status/:merchantOrderId', async (req, res) => {
  try {
    const { merchantOrderId } = req.params;
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    
    const statusResponse = await fetch(
      `${PHONEPE_API_URL}/checkout/v2/order/${merchantOrderId}/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-VERIFY': generateSignature()
        }
      }
    );
    
    const statusData = await statusResponse.json();
    
    // Update database with new status
    await updatePhonePeTransaction(merchantOrderId, statusData.data.state);
    
    res.json({ success: true, data: statusData.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. Webhook for Payment Confirmation
 */
router.post('/callback', async (req, res) => {
  try {
    const { transactionId, merchantOrderId, state, amount } = req.body;
    
    // Verify signature
    const isValid = verifySignature(req.headers['x-verify'], req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Update payment status
    if (state === 'COMPLETED') {
      await updatePhonePeTransaction(merchantOrderId, 'SUCCESS');
      
      // Trigger wallet credit
      await creditUserWallet(merchantOrderId, amount);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🎯 Key Differences from Web Integration

| Aspect | Web (Current) | Android SDK (Official) |
|--------|---------------|----------------------|
| **Checkout** | Browser redirect | App-native modal |
| **UX** | Leave app | Stay in app |
| **Speed** | Slower | Faster |
| **Auth Flow** | OAuth | OAuth (same) |
| **Payment Methods** | All | UPI, Cards, Net Banking |
| **Signature** | Simple | Complex with payload |
| **Error Handling** | Callback URL | Return to app |

---

## 🚀 Implementation Steps

### Phase 1: Backend API Updates
1. Implement Auth Token endpoint
2. Implement Create Order endpoint
3. Implement Order Status endpoint
4. Implement Webhook handler
5. Test with Postman

### Phase 2: React Native Updates
1. Update paymentService.js
2. Update payment modal component
3. Handle SDK responses
4. Add status polling

### Phase 3: Native Module
1. Create Expo config plugin (if using Expo)
2. OR Eject and add native code
3. Integrate PhonePe Android SDK
4. Handle payment callbacks

### Phase 4: Testing
1. Sandbox environment testing
2. End-to-end flow verification
3. Error handling testing
4. Production migration

---

## 📝 Environment Configuration

### Backend .env
```
# PhonePe OAuth
PHONEPE_AUTH_URL=https://api.phonepe.com/apis/identity-manager
PHONEPE_API_URL=https://api.phonepe.com/apis/pg
PHONEPE_MERCHANT_ID=M18UH4EERGY0
PHONEPE_API_KEY=ba33ba9c-a4fc-4bea-bf2b-ble1f7c05fac

# Sandbox for testing
PHONEPE_SANDBOX_URL=https://api-preprod.phonepe.com/apis/pg-sandbox

# Webhooks
PHONEPE_WEBHOOK_URL=https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
```

---

## ✅ Benefits of Official SDK

✅ **Official Support** - PhonePe maintains the SDK  
✅ **Secure** - Built-in security measures  
✅ **Better UX** - App-native checkout  
✅ **All Payment Methods** - UPI, Cards, Net Banking  
✅ **Error Handling** - Proper callback handling  
✅ **Analytics** - Built-in tracking  

---

## ⚠️ Important Notes

- PhonePe SDK requires **Android 5.0+ (API 21)**
- **Sandbox** URL for testing: `https://api-preprod.phonepe.com/apis/pg-sandbox/`
- **Production** URL: `https://api.phonepe.com/apis/pg/`
- Always test in **Sandbox first**
- Webhook signature verification is **mandatory**

---

## 📞 Resources

- PhonePe API Docs: https://www.phonepe.com/business/support
- Android SDK Documentation: (provided in your message)
- Sandbox Testing: Use test merchant credentials
- Production: Use live credentials from PhonePe dashboard

---

**Next Steps:**
1. Review PhonePe Android SDK documentation
2. Update backend with official API endpoints
3. Create native bridge module
4. Test in sandbox environment
5. Deploy to production

---

Generated: August 7, 2026
