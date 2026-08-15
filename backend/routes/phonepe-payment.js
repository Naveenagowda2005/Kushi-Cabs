/**
 * PhonePe Payment Gateway - Standard Checkout v2
 * Official current API: OAuth2 + checkout/v2/pay
 *
 * Credentials needed (from PhonePe Dashboard → Developer Settings):
 *   PHONEPE_CLIENT_ID     = Client ID  (shown as "Merchant ID" in older dashboards)
 *   PHONEPE_CLIENT_SECRET = Client Secret (shown as "API Key / Salt Key" in older dashboards)
 *   PHONEPE_CLIENT_VERSION = 1 (default)
 *
 * Flow:
 *   1. POST identity-manager/v1/oauth/token  → get O-Bearer access token
 *   2. POST checkout/v2/pay                  → get orderId + redirectUrl
 *   3. App opens redirectUrl in browser       → user pays
 *   4. PhonePe POSTs to /callback            → we credit wallet
 *   5. App polls /order-status               → confirms
 */

const express = require('express');
const axios   = require('axios');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Config ────────────────────────────────────────────────────────────────────
const IS_SANDBOX = process.env.PHONEPE_ENV === 'sandbox';

// Credentials - try v2 names first, fall back to old names
const CLIENT_ID      = process.env.PHONEPE_CLIENT_ID      || process.env.PHONEPE_MERCHANT_ID;
const CLIENT_SECRET  = process.env.PHONEPE_CLIENT_SECRET  || process.env.PHONEPE_API_KEY;
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '1';

const AUTH_URL = IS_SANDBOX
  ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token'
  : 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';

const PAY_URL = IS_SANDBOX
  ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay'
  : 'https://api.phonepe.com/apis/pg/checkout/v2/pay';

const STATUS_BASE = IS_SANDBOX
  ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/v2/order'
  : 'https://api.phonepe.com/apis/pg/v2/order';

console.log(`📱 PhonePe v2 Config`);
console.log(`   Client ID  : ${CLIENT_ID}`);
console.log(`   Env        : ${IS_SANDBOX ? 'SANDBOX' : 'PRODUCTION'}`);
console.log(`   Auth URL   : ${AUTH_URL}`);
console.log(`   Pay URL    : ${PAY_URL}`);

// ── Token cache ───────────────────────────────────────────────────────────────
let _token = null;
let _tokenExpiresAt = 0;

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_token && now < _tokenExpiresAt - 60) {
    return _token;
  }

  console.log(`🔑 Fetching new PhonePe OAuth token...`);

  const body = new URLSearchParams({
    client_id:      CLIENT_ID,
    client_version: CLIENT_VERSION,
    client_secret:  CLIENT_SECRET,
    grant_type:     'client_credentials',
  });

  const resp = await axios.post(AUTH_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 12000,
  });

  _token          = resp.data.access_token;
  _tokenExpiresAt = resp.data.expires_at || (now + 3600);

  console.log(`✅ Token received, expires_at: ${_tokenExpiresAt}`);
  return _token;
}

// ── Merchant order ID ─────────────────────────────────────────────────────────
function makeMerchantOrderId(userId) {
  const ts   = Date.now();
  const rand = Math.floor(Math.random() * 9999);
  // Max 63 chars, only alphanum + _ -
  const uid  = userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
  return `TXN_${uid}_${ts}_${rand}`.substring(0, 63);
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/phonepe/auth-token   (kept for frontend compatibility)
// ═════════════════════════════════════════════════════════════════════════════
router.post('/auth-token', async (req, res) => {
  try {
    const token = await getToken();
    return res.json({ success: true, data: { accessToken: token, expiresIn: 3600 } });
  } catch (err) {
    console.error('❌ Auth token error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.response?.data?.message || err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/phonepe/create-order
// ═════════════════════════════════════════════════════════════════════════════
router.post('/create-order', async (req, res) => {
  try {
    const { userId, amount, userType = 'driver' } = req.body;

    if (!userId || !amount || Number(amount) < 1) {
      return res.status(400).json({ error: 'userId and amount (≥ ₹1) are required' });
    }

    // Lookup user
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, phone, full_name')
      .eq('id', userId)
      .single();

    if (userErr || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const merchantOrderId = makeMerchantOrderId(userId);
    const amountPaisa     = Math.round(Number(amount) * 100); // PhonePe needs paisa
    const backendUrl      = process.env.BACKEND_URL || 'http://192.168.1.110:4000';

    // Save to DB first
    const { error: insertErr } = await supabase.from('phonepe_transactions').insert([{
      user_id:                  userId,
      user_type:                userType,
      amount:                   Number(amount),
      merchant_transaction_id:  merchantOrderId,
      phonepe_transaction_id:   null,
      status:                   'INITIATED',
      created_at:               new Date().toISOString(),
    }]);
    if (insertErr) console.warn('DB insert warn:', insertErr.message);

    // Get OAuth token
    const accessToken = await getToken();

    // Build PhonePe v2 payload
    const payload = {
      merchantOrderId,
      amount: amountPaisa,
      expireAfter: 1200,
      metaInfo: { udf1: userId, udf2: userType },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: 'Kushi Cabs Wallet Recharge',
        merchantUrls: {
          redirectUrl: `${backendUrl}/api/phonepe/redirect?txnId=${merchantOrderId}`,
        },
      },
    };

    console.log(`📱 Creating PhonePe order: ${merchantOrderId}, ₹${amount} (${amountPaisa} paisa)`);

    const ppRes = await axios.post(PAY_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`,
      },
      timeout: 15000,
    });

    const ppData = ppRes.data;
    console.log(`✅ PhonePe response:`, JSON.stringify(ppData).substring(0, 300));

    // Response has redirectUrl directly (checkout/v2/pay returns it top-level)
    const checkoutUrl = ppData.redirectUrl;

    if (!checkoutUrl) {
      throw new Error(`PhonePe did not return a redirectUrl. Response: ${JSON.stringify(ppData)}`);
    }

    // Update DB with PhonePe order ID
    await supabase
      .from('phonepe_transactions')
      .update({ phonepe_transaction_id: ppData.orderId })
      .eq('merchant_transaction_id', merchantOrderId);

    return res.json({
      success: true,
      data: {
        merchantOrderId,
        transactionId:   merchantOrderId,
        phonePeOrderId:  ppData.orderId,
        amount:          Number(amount),
        checkoutUrl,
        state:           ppData.state || 'PENDING',
      },
    });

  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('❌ Create order error:', detail);
    return res.status(500).json({ error: 'Failed to create PhonePe order', detail });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/phonepe/order-status/:merchantOrderId
// ═════════════════════════════════════════════════════════════════════════════
router.get('/order-status/:merchantOrderId', async (req, res) => {
  try {
    const { merchantOrderId } = req.params;

    // Check DB first
    const { data: txn } = await supabase
      .from('phonepe_transactions')
      .select('*')
      .eq('merchant_transaction_id', merchantOrderId)
      .maybeSingle();

    // Already final — return from DB
    if (txn && (txn.status === 'SUCCESS' || txn.status === 'FAILED')) {
      return res.json({ success: true, data: { merchantOrderId, state: txn.status, amount: txn.amount } });
    }

    // Query PhonePe live using PhonePe's own orderId (OMO...)
    try {
      const accessToken = await getToken();
      const phonepeOrderId = txn?.phonepe_transaction_id;
      const statusUrl = phonepeOrderId
        ? `${STATUS_BASE}/${phonepeOrderId}`
        : `${STATUS_BASE}/${merchantOrderId}`;

      const ppRes = await axios.get(statusUrl, {
        headers: { 'Authorization': `O-Bearer ${accessToken}` },
        timeout: 10000,
      });

      const ppData   = ppRes.data;
      const rawState = ppData.state || 'PENDING';

      // Map to our states
      const stateMap = {
        'COMPLETED':        'SUCCESS',
        'PAYMENT_SUCCESS':  'SUCCESS',
        'FAILED':           'FAILED',
        'PAYMENT_DECLINED': 'FAILED',
        'TIMED_OUT':        'FAILED',
      };
      const state = stateMap[rawState] || rawState;

      console.log(`📊 Order status: ${merchantOrderId} → ${rawState} → ${state}`);

      if (state === 'SUCCESS' || state === 'FAILED') {
        await supabase
          .from('phonepe_transactions')
          .update({ status: state, verified_at: new Date().toISOString() })
          .eq('merchant_transaction_id', merchantOrderId);

        if (state === 'SUCCESS' && txn) {
          await creditWallet(txn.user_id, txn.amount, merchantOrderId);
        }
      }

      return res.json({ success: true, data: { merchantOrderId, state, amount: txn?.amount } });

    } catch (ppErr) {
      console.warn('⚠️  PhonePe status failed, using DB:', ppErr.response?.data || ppErr.message);
      return res.json({
        success: true,
        data: { merchantOrderId, state: txn?.status || 'PENDING', amount: txn?.amount },
      });
    }

  } catch (err) {
    console.error('❌ Order status error:', err.message);
    return res.status(500).json({ error: 'Failed to get order status' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/phonepe/callback   (PhonePe webhook)
// ═════════════════════════════════════════════════════════════════════════════
router.post('/callback', async (req, res) => {
  try {
    console.log(`📱 PhonePe Webhook:`, JSON.stringify(req.body).substring(0, 300));

    const merchantOrderId = req.body.merchantOrderId || req.body.data?.merchantOrderId;
    const state           = req.body.state           || req.body.data?.state;

    await supabase.from('phonepe_webhook_logs').insert([{
      transaction_id: merchantOrderId,
      status:         state,
      payload:        req.body,
      received_at:    new Date().toISOString(),
    }]);

    const stateMap = { 'COMPLETED': 'SUCCESS', 'FAILED': 'FAILED', 'PAYMENT_SUCCESS': 'SUCCESS', 'PAYMENT_DECLINED': 'FAILED' };
    const newStatus = stateMap[state] || 'PENDING';

    await supabase
      .from('phonepe_transactions')
      .update({ status: newStatus, verified_at: new Date().toISOString() })
      .eq('merchant_transaction_id', merchantOrderId);

    if (newStatus === 'SUCCESS') {
      const { data: txn } = await supabase
        .from('phonepe_transactions')
        .select('user_id, amount')
        .eq('merchant_transaction_id', merchantOrderId)
        .maybeSingle();

      if (txn) await creditWallet(txn.user_id, txn.amount, merchantOrderId);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    return res.json({ success: false });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET+POST /api/phonepe/redirect   (after user pays, PhonePe redirects here)
// ─ PhonePe sends ?merchantOrderId=... or txnId=... as query params
// ═════════════════════════════════════════════════════════════════════════════
async function handleRedirect(req, res) {
  const merchantOrderId = req.query.txnId || req.query.merchantOrderId || req.body?.merchantOrderId;
  console.log(`📱 PhonePe redirect received, txnId: ${merchantOrderId}`);

  if (merchantOrderId) {
    try {
      // Look up the PhonePe orderId from DB
      const { data: txn } = await supabase
        .from('phonepe_transactions')
        .select('*')
        .eq('merchant_transaction_id', merchantOrderId)
        .maybeSingle();

      if (txn && txn.status === 'INITIATED') {
        // Query PhonePe for actual status using PhonePe orderId
        try {
          const accessToken = await getToken();
          const phonepeOrderId = txn.phonepe_transaction_id; // OMO...
          const statusUrl = phonepeOrderId
            ? `${STATUS_BASE}/${phonepeOrderId}`
            : `${STATUS_BASE}/${merchantOrderId}`;

          const ppRes = await axios.get(statusUrl, {
            headers: { 'Authorization': `O-Bearer ${accessToken}` },
            timeout: 10000,
          });

          const rawState = ppRes.data.state || 'PENDING';
          const stateMap = { 'COMPLETED': 'SUCCESS', 'PAYMENT_SUCCESS': 'SUCCESS', 'FAILED': 'FAILED', 'PAYMENT_DECLINED': 'FAILED', 'TIMED_OUT': 'FAILED' };
          const newStatus = stateMap[rawState] || rawState;

          console.log(`📊 Redirect status check: ${merchantOrderId} → ${rawState} → ${newStatus}`);

          if (newStatus === 'SUCCESS' || newStatus === 'FAILED') {
            await supabase
              .from('phonepe_transactions')
              .update({ status: newStatus, verified_at: new Date().toISOString() })
              .eq('merchant_transaction_id', merchantOrderId);

            if (newStatus === 'SUCCESS') {
              await creditWallet(txn.user_id, txn.amount, merchantOrderId);
            }
          }
        } catch (e) {
          console.warn('⚠️  Status check on redirect failed:', e.response?.data || e.message);
          // Mark as SUCCESS optimistically for sandbox (user completed the flow)
          if (IS_SANDBOX) {
            await supabase
              .from('phonepe_transactions')
              .update({ status: 'SUCCESS', verified_at: new Date().toISOString() })
              .eq('merchant_transaction_id', merchantOrderId);
            await creditWallet(txn.user_id, txn.amount, merchantOrderId);
            console.log(`✅ Sandbox: marked ${merchantOrderId} as SUCCESS on redirect`);
          }
        }
      }
    } catch (e) {
      console.error('❌ Redirect handler error:', e.message);
    }
  }

  res.send('<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>✅ Payment processed</h2><p>You can close this window and return to the app.</p></body></html>');
}

router.get('/redirect', handleRedirect);
router.post('/redirect', handleRedirect);

// ═════════════════════════════════════════════════════════════════════════════
// Helper: credit wallet (idempotent)
// ═════════════════════════════════════════════════════════════════════════════
async function creditWallet(userId, amount, merchantOrderId) {
  try {
    const { data: existing } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('external_reference_id', merchantOrderId)
      .maybeSingle();

    if (existing) {
      console.log(`⚠️  Wallet already credited for ${merchantOrderId}`);
      return;
    }

    await supabase.from('wallet_transactions').insert([{
      user_id:               userId,
      type:                  'credit',
      amount,
      description:           `PhonePe wallet recharge - ${merchantOrderId}`,
      payment_gateway:       'phonepe',
      external_reference_id: merchantOrderId,
      created_at:            new Date().toISOString(),
    }]);

    console.log(`✅ Wallet credited: user=${userId}, ₹${amount}`);
  } catch (err) {
    console.error('❌ Wallet credit error:', err.message);
  }
}

module.exports = router;
