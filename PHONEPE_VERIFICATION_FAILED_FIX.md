# PhonePe "Verification Failed" - Diagnosis & Fix

## Problem
When user initiates payment:
1. ✅ Order created on backend
2. ✅ Deep link to PhonePe opens successfully  
3. ❌ PhonePe shows "Verification Failed"

## Root Cause Analysis

The "verification failed" error from PhonePe means it cannot validate your merchant credentials. Looking at the backend .env:

```
PHONEPE_MERCHANT_ID=M18UH4EERGY0
PHONEPE_API_KEY=ba33ba9c-a4fc-4bea-bf2b-ble1f7c05fac
```

**Issues identified:**
1. The API key format looks like a placeholder/mock value (note `ble1f7c` - unusual character sequence)
2. These might not be real PhonePe credentials
3. Environment is set to `PHONEPE_ENV=sandbox` but the merchant ID might be production

## What PhonePe Needs

For PhonePe to work, you need:

1. **Valid Merchant Account**: Sign up at https://merchant.phonepe.com
2. **Merchant ID**: From your PhonePe Merchant Dashboard
3. **API Key/Salt**: From your PhonePe Merchant Dashboard (Security Settings)
4. **Key Index**: Usually `1` (from Security Settings)
5. **Callback URL**: For webhooks (must be HTTPS and match registered URL)

## Next Steps

### Step 1: Get Real PhonePe Credentials
1. Go to https://merchant.phonepe.com
2. Login to your merchant account
3. Go to **Settings → Security Settings**
4. Find your:
   - Merchant ID
   - API Key (Salt)
   - Key Index

### Step 2: Update Backend .env
Replace with your actual credentials:
```
PHONEPE_MERCHANT_ID=YOUR_REAL_MERCHANT_ID
PHONEPE_API_KEY=YOUR_REAL_API_KEY
PHONEPE_KEY_INDEX=YOUR_KEY_INDEX
```

### Step 3: Verify Environment
```
# For testing (accepts any UPI ID):
PHONEPE_ENV=sandbox

# For production (real payments):
PHONEPE_ENV=production
```

### Step 4: Register Callback URL
In PhonePe Merchant Dashboard:
- Go to **Settings → Webhooks**
- Add callback URL: `https://your-backend-url.com/api/phonepe/callback`
- This receives payment status updates

### Step 5: Test Payment Flow
After updating credentials:
1. Restart backend: `npm start`
2. Try payment again
3. PhonePe should accept the request (if credentials are correct)

## How to Get PhonePe Credentials

### If you don't have PhonePe merchant account:

1. **Create Account**:
   - Visit https://merchant.phonepe.com
   - Sign up as business/merchant
   - Provide: Business details, GST/PAN, bank account

2. **Get Sandbox Credentials** (for testing):
   - PhonePe provides sandbox merchant ID and API key for free testing
   - These are different from production credentials
   - Sandbox allows testing without real payments

3. **Activate Production** (for real payments):
   - Once tested, switch PHONEPE_ENV to `production`
   - Use production merchant ID and API key
   - Real payments will be processed

## Testing Checklist

- [ ] You have valid PhonePe merchant account
- [ ] You have real Merchant ID (not placeholder)
- [ ] You have real API Key from PhonePe dashboard
- [ ] Backend .env updated with real credentials
- [ ] Backend restarted after env changes
- [ ] Callback URL registered in PhonePe dashboard
- [ ] Testing with sandbox credentials first
- [ ] Payment attempt shows PhonePe accepting request (no verification error)

## Alternative: Use PhonePe Sandbox

If you don't have a merchant account yet, use PhonePe's public sandbox:

```
PHONEPE_MERCHANT_ID=ONESTEPCHECKOUT
PHONEPE_API_KEY=TESTKEY123
PHONEPE_ENV=sandbox
```

But this is for demo only - won't process real payments.

## Debugging Steps

If still getting "verification failed":

1. **Check Logs**:
   ```
   Log into: https://merchant.phonepe.com/dashboard
   Go to: Transactions or Logs
   Look for your merchant ID
   ```

2. **Verify Signature Generation**:
   - The backend generates signatures using Merchant ID + API Key
   - If API key is wrong, signature is wrong
   - PhonePe rejects invalid signatures

3. **Check Callback URL**:
   - Make sure callback URL is registered in PhonePe
   - Must be HTTPS (not HTTP)
   - Must match exactly what's in PhonePe dashboard

4. **Test with PhonePe Support**:
   - Contact PhonePe support with:
     - Your Merchant ID
     - Error message
     - Transaction ID from logs
     - They can debug on their side

## Current Status

❌ Current credentials appear to be placeholder/invalid
🔧 Need to obtain real PhonePe merchant credentials
⏳ Once updated, should resolve "verification failed" error

---
**Next Action**: Update backend .env with real PhonePe credentials and restart
