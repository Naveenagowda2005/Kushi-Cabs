# PhonePe Payment Integration - Implementation Plan

## Overview
- **Payment Type**: Driver commission payment BEFORE accepting trip
- **Refund Policy**: Based on cancellation timing
- **Status**: Implementation Starting

## Refund Rules

| Cancellation Timing | Refund Amount |
|-------------------|---------------|
| On scheduled date | 0% (No refund) |
| After 30 mins of accept | 50% refund |
| Within 30 mins of accept | 100% refund |

## Implementation Components

### 1. Database Schema
- `payments` - Payment transactions
- `refunds` - Refund records
- Updates to `trips` table for payment tracking

### 2. Backend Services
- PhonePe API integration
- Payment initiation
- Payment verification
- Refund processing
- Webhook handler

### 3. Frontend Components
- Payment screen (before trip acceptance)
- Payment status UI
- Transaction history
- Refund notifications

### 4. API Endpoints
- `POST /payments/initiate` - Start payment
- `POST /payments/verify` - Verify payment
- `POST /payments/refund` - Process refund
- `POST /webhooks/phonepe` - PhonePe callback
- `GET /payments/history` - Transaction history

## Flow Diagram

```
Driver sees trip → Clicks Accept → Payment Screen → PhonePe UPI → Payment Success → Trip Accepted

If Cancel within 30 mins → Automatic 100% refund
If Cancel after 30 mins → Manual 50% refund processing
If Cancel on scheduled date → No refund
```

## Files to Create

### Backend
1. `backend/services/phonePeService.js` - PhonePe API wrapper
2. `backend/services/refundService.js` - Refund logic
3. `backend/routes/payments.js` - Payment endpoints
4. `backend/migrations/payments.sql` - Database schema

### Frontend
1. `PaymentScreen.js` - Payment UI
2. `usePayment.js` - Payment hook
3. `useRefund.js` - Refund hook
4. `TransactionHistory.js` - History UI

## PhonePe Credentials Needed

- Merchant ID: `__NEEDED__`
- API Key: `__NEEDED__`
- API Secret: `__NEEDED__`
- Environment: Sandbox or Production

## Next Steps
1. Provide PhonePe credentials
2. Create database migrations
3. Build backend services
4. Create frontend UI
5. Test end-to-end
6. Deploy to production

---

**Status**: Awaiting PhonePe credentials
