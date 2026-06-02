import { Linking, Platform } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { supabase } from '../lib/supabase';

// Replace with your Razorpay Key ID from dashboard.razorpay.com
const RAZORPAY_KEY_ID = 'rzp_test_SknzQ9p24mWj7T';

// PhonePe merchant UPI ID - MUST be in format: username@bankname (e.g., merchant@okhdfcbank)
// Current value might need verification if payment screen shows blank/generic UPI screen
const PHONEPE_UPI_ID = 'M18UH4EERGY0';  // TODO: Verify this is a valid UPI ID in format username@bankname
const PHONEPE_MERCHANT_NAME = 'KUSHI CABS';

const PAYMENT_GATEWAYS = {
  RAZORPAY: 'razorpay',
  PHONEPE: 'phonepe',
};

async function startPhonePeCheckout({ amount, orderId }) {
  const amountValue = Number(amount).toFixed(2);
  
  // Validate inputs
  if (!PHONEPE_UPI_ID) {
    throw new Error('PhonePe UPI ID not configured. Please check merchant settings.');
  }
  
  if (!amountValue || isNaN(amountValue) || parseFloat(amountValue) <= 0) {
    throw new Error('Invalid payment amount');
  }
  
  // Warn if UPI ID doesn't look like a valid format (should have @ symbol)
  if (!PHONEPE_UPI_ID.includes('@')) {
    console.warn('[PhonePe] ⚠️  WARNING: UPI ID does not contain @ symbol. Valid format is: username@bankname');
    console.warn('[PhonePe] Current UPI ID:', PHONEPE_UPI_ID);
    console.warn('[PhonePe] Payment may open but show blank screen. If this happens, please verify the UPI ID configuration.');
  }
  
  console.log('[PhonePe] Payment Details:', {
    upiId: PHONEPE_UPI_ID,
    merchantName: PHONEPE_MERCHANT_NAME,
    amount: amountValue,
    orderId: orderId,
  });

  // Standard UPI deep link format that all UPI apps (including PhonePe) support
  // Reference: https://www.npci.org.in/UPI-Current-Transaction-Types
  const upiParams = [
    `pa=${encodeURIComponent(PHONEPE_UPI_ID)}`,           // Payee address (UPI ID)
    `pn=${encodeURIComponent(PHONEPE_MERCHANT_NAME)}`,    // Payee name
    `tr=${encodeURIComponent(orderId)}`,                  // Transaction reference ID
    `tn=${encodeURIComponent('Trip Commission')}`,        // Transaction note
    `am=${encodeURIComponent(amountValue)}`,              // Amount
    'cu=INR',                                              // Currency
  ].join('&');

  const upiUrl = `upi://pay?${upiParams}`;
  
  console.log('[PhonePe] Full UPI URL length:', upiUrl.length);
  console.log('[PhonePe] Opening UPI URL...');

  try {
    // Check if device can open UPI URLs
    const canOpen = await Linking.canOpenURL(upiUrl);
    console.log(`[PhonePe] Can open UPI URL: ${canOpen}`);
    
    if (!canOpen) {
      throw new Error('No UPI app available');
    }
    
    // Open the UPI URL - PhonePe will intercept it
    await Linking.openURL(upiUrl);
    console.log('[PhonePe] UPI URL opened successfully');
    
    return { success: true, pending: true };
  } catch (err) {
    console.error('[PhonePe] Error opening UPI URL:', {
      message: err.message,
      code: err.code,
      url: upiUrl.substring(0, 100),
    });
    
    if (err.message.includes('No UPI app available')) {
      throw new Error('No UPI app found. Please install PhonePe, Google Pay, Paytm, or any UPI app on your device.');
    }
    
    throw new Error('Could not open payment app. Make sure a UPI app is installed.');
  }
}

/**
 * Initiates a wallet deposit flow.
 * 1. Creates a payment order record in DB
 * 2. Opens the selected gateway flow (Razorpay or PhonePe)
 * 3. On success, credits wallet via RPC or leaves a pending PhonePe order for confirmation
 */
export async function initiateDeposit({ userId, amount, userEmail, userName, gateway = PAYMENT_GATEWAYS.RAZORPAY, minAmount = 100 }) {
  if (!amount || amount < minAmount) {
    throw new Error(`Minimum deposit amount is ₹${minAmount}`);
  }

  // 1. Create order record in DB
  const orderPayload = {
    user_id:          userId,
    type:             'deposit',
    amount,
    status:           'pending',
    gateway,
    razorpay_order_id: gateway === PAYMENT_GATEWAYS.RAZORPAY ? `order_${Date.now()}` : null,
    phonepe_order_id: gateway === PAYMENT_GATEWAYS.PHONEPE ? `phonepe_${Date.now()}` : null,
  };

  let { data: order, error: orderErr } = await supabase
    .from('payment_orders')
    .insert(orderPayload)
    .select()
    .single();

  if (orderErr && orderErr.code === 'PGRST204' && /gateway|phonepe_order_id|phonepe_payment_id/.test(orderErr.message)) {
    const fallbackPayload = { ...orderPayload };
    delete fallbackPayload.gateway;
    delete fallbackPayload.phonepe_order_id;
    delete fallbackPayload.phonepe_payment_id;

    ({ data: order, error: orderErr } = await supabase
      .from('payment_orders')
      .insert(fallbackPayload)
      .select()
      .single());
  }

  if (orderErr) throw orderErr;

  // 2. Handle PhonePe payment
  if (gateway === PAYMENT_GATEWAYS.PHONEPE) {
    try {
      const result = await startPhonePeCheckout({ amount, orderId: order.id });
      if (result.pending) {
        return {
          success: true,
          pending: true,
          message: 'PhonePe payment started. Complete payment in your PhonePe app, then return to confirm.',
        };
      }
    } catch (err) {
      // Update order as failed
      await supabase.from('payment_orders').update({ status: 'failed' }).eq('id', order.id);
      throw err;  // Re-throw to let caller handle it
    }
  }

  // 3. Handle Razorpay payment (default)
  const options = {
    description:  'Wallet Deposit',
    image:        'https://your-logo-url.png',
    currency:     'INR',
    key:          RAZORPAY_KEY_ID,
    amount:       amount * 100,  // Razorpay uses paise
    name:         'Taxi Service',
    order_id:     order.razorpay_order_id,
    prefill: {
      email: userEmail ?? '',
      name:  userName  ?? '',
    },
    theme: { color: '#1a1a2e' },
  };

  return new Promise((resolve, reject) => {
    RazorpayCheckout.open(options)
      .then(async (paymentData) => {
        // Payment successful — credit wallet
        const { data, error } = await supabase.rpc('verify_and_credit_deposit', {
          p_user_id:    userId,
          p_order_id:   order.razorpay_order_id,
          p_payment_id: paymentData.razorpay_payment_id,
          p_amount:     amount,
        });

        if (error) return reject(new Error(error.message));
        if (!data.success) return reject(new Error('Payment verification failed'));

        resolve({ success: true, newBalance: data.new_balance });
      })
      .catch((error) => {
        // User cancelled or payment failed
        supabase.from('payment_orders')
          .update({ status: 'failed' })
          .eq('id', order.id);

        reject(new Error(error.description ?? 'Payment cancelled'));
      });
  });
}

/**
 * Submits a withdrawal request.
 * Actual bank transfer is done manually by admin.
 */
export async function requestWithdrawal({ userId, amount, method, details }) {
  // Use existing atomic withdrawal RPC
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_user_id: userId,
    p_amount:  amount,
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error);

  // Record withdrawal request with bank details
  await supabase.from('payment_orders').insert({
    user_id:      userId,
    type:         'withdrawal',
    amount,
    status:       'pending',
    bank_account: method === 'bank' ? details.accountNumber : null,
    ifsc_code:    method === 'bank' ? details.ifsc : null,
    upi_id:       method === 'upi'  ? details.upiId : null,
  });

  return { success: true, newBalance: data.new_balance };
}
