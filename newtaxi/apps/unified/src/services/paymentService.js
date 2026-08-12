import { API_CONFIG } from '../constants';

/**
 * PhonePe Payment Service (Official Android SDK Integration)
 * Implements OAuth token flow with PhonePe official API
 * Handles wallet recharge via PhonePe UPI payments
 */

/**
 * Generate unique merchant transaction ID
 * Format: PREFIX_USERID_TIMESTAMP_RANDOM
 */
const generateMerchantTransactionId = (userId) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `TXN_${userId}_${timestamp}_${random}`;
};

// ============================================================
// OAuth Token Management
// ============================================================

let cachedAuthToken = null;
let tokenExpirationTime = null;

/**
 * Get PhonePe OAuth Access Token
 * Tokens are cached and reused until expiration
 * @returns {Promise<string>} Access token
 */
export const getPhonePeAuthToken = async () => {
  try {
    // Check if we have a valid cached token
    if (cachedAuthToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
      console.log(`🔐 Using cached auth token (expires in ${Math.floor((tokenExpirationTime - Date.now()) / 1000)}s)`);
      return cachedAuthToken;
    }

    console.log(`🔐 Requesting new PhonePe auth token...`);

    const response = await fetch(`${API_CONFIG.SMS_API_URL}/api/phonepe/auth-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Auth token error:', data);
      throw new Error(data.error || 'Failed to get auth token');
    }

    console.log('✅ Auth token received');
    console.log(`   Type: ${data.data.tokenType}`);
    console.log(`   Expires in: ${data.data.expiresIn}s`);

    // Cache the token
    cachedAuthToken = data.data.accessToken;
    tokenExpirationTime = Date.now() + (data.data.expiresIn * 1000) - 60000; // Refresh 1 min before expiry

    return cachedAuthToken;
  } catch (error) {
    console.error('❌ Auth token error:', error.message);
    throw error;
  }
};

/**
 * Create PhonePe Payment Order
 * @param {string} userId - User ID
 * @param {number} amount - Amount in rupees
 * @param {string} userType - 'driver', 'vendor', or 'super_admin'
 * @returns {Promise<{merchantOrderId, transactionId, amount, payload, signature, paymentEndpoint, orderData}>}
 */
export const createPhonePeOrder = async (userId, amount, userType = 'driver') => {
  try {
    console.log(`📱 Creating PhonePe order...`);
    console.log(`   User: ${userId}`);
    console.log(`   Amount: ₹${amount}`);

    // Get auth token
    const authToken = await getPhonePeAuthToken();

    const merchantOrderId = generateMerchantTransactionId(userId);

    // Create order
    const response = await fetch(`${API_CONFIG.SMS_API_URL}/api/phonepe/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId,
        amount,
        merchantOrderId,
        userType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Order creation failed:', data);
      throw new Error(data.error || 'Failed to create order');
    }

    console.log('✅ Order created successfully');
    console.log(`   Order ID: ${data.data.merchantOrderId}`);
    console.log(`   Transaction ID: ${data.data.transactionId}`);
    console.log(`   Checkout URL: ${data.data.checkoutUrl}`);

    return {
      merchantOrderId: data.data.merchantOrderId,
      transactionId: data.data.transactionId,
      amount: data.data.amount,
      token: data.data.token,
      checkoutUrl: data.data.checkoutUrl,
      phonePeOrderId: data.data.phonePeOrderId,
      state: data.data.state,
    };
  } catch (error) {
    console.error('❌ Order creation error:', error.message);
    throw error;
  }
};

/**
 * Verify PhonePe Payment (Check order status)
 * @param {string} merchantOrderId - Merchant order ID
 * @returns {Promise<{state, responseCode, transactionId, amount}>}
 */
export const verifyPhonePePayment = async (merchantOrderId) => {
  try {
    console.log(`📊 Verifying PhonePe payment: ${merchantOrderId}`);

    // Get auth token
    const authToken = await getPhonePeAuthToken();

    const response = await fetch(
      `${API_CONFIG.SMS_API_URL}/api/phonepe/order-status/${merchantOrderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Status verification failed:', data);
      throw new Error(data.error || 'Failed to verify payment');
    }

    console.log('✅ Payment verified');
    console.log(`   State: ${data.data.state}`);
    console.log(`   Response Code: ${data.data.responseCode}`);

    return {
      state: data.data.state,
      responseCode: data.data.responseCode,
      transactionId: data.data.transactionId,
      amount: data.data.amount,
    };
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    throw error;
  }
};

// ============================================================
// High-level Payment Initiation
// ============================================================

/**
 * Initiate Deposit (Alias for initiatePhonePePayment for backward compatibility)
 * @param {object} depositData - {userId, amount, paymentGateway}
 * @returns {Promise<{success: boolean, data: {merchantOrderId, transactionId}, error: string}>}
 */
export const initiateDeposit = async (depositData) => {
  try {
    const { userId, amount, paymentGateway = 'phonepe' } = depositData;

    if (paymentGateway !== 'phonepe') {
      throw new Error(`Payment gateway ${paymentGateway} not supported`);
    }

    return await initiatePhonePePayment(userId, amount, 'driver');
  } catch (error) {
    console.error('❌ Deposit initiation error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Initiate PhonePe payment (high-level wrapper)
 * @param {string} userId - User ID
 * @param {number} amount - Amount in rupees
 * @param {string} userType - 'driver', 'vendor', or 'super_admin'
 * @returns {Promise<{success: boolean, data: {merchantOrderId, transactionId, payload, signature, paymentEndpoint, orderData}, error: string}>}
 */
export const initiatePhonePePayment = async (userId, amount, userType = 'driver') => {
  try {
    if (!userId || !amount || amount < 1) {
      throw new Error('Invalid parameters: userId and amount (minimum ₹1) required');
    }

    console.log(`💳 Initiating PhonePe payment`);
    console.log(`   User: ${userId}`);
    console.log(`   Amount: ₹${amount}`);
    console.log(`   Type: ${userType}`);

    // Create order via OAuth flow
    const orderResult = await createPhonePeOrder(userId, amount, userType);

    console.log('✅ Payment initiated successfully');
    console.log(`   Transaction ID: ${orderResult.transactionId}`);

    return {
      success: true,
      data: {
        merchantOrderId: orderResult.merchantOrderId,
        transactionId: orderResult.transactionId,
        token: orderResult.token,
        checkoutUrl: orderResult.checkoutUrl,
        phonePeOrderId: orderResult.phonePeOrderId,
        state: orderResult.state,
      },
    };
  } catch (error) {
    console.error('❌ PhonePe initiation error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check payment status
 * @param {string} transactionId - Merchant transaction ID or order ID
 * @returns {Promise<{success: boolean, data: {state, responseCode}, error: string}>}
 */
export const checkPhonePePaymentStatus = async (transactionId) => {
  try {
    if (!transactionId) {
      throw new Error('Transaction ID required');
    }

    console.log(`📊 Checking PhonePe payment status: ${transactionId}`);

    const statusResult = await verifyPhonePePayment(transactionId);

    console.log(`✅ Payment status: ${statusResult.state}`);

    return {
      success: true,
      data: {
        state: statusResult.state,
        responseCode: statusResult.responseCode,
        transactionId: statusResult.transactionId,
        amount: statusResult.amount,
      },
    };
  } catch (error) {
    console.error('❌ Status check error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Format amount for display
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted string
 */
const formatPaymentAmount = (amount) => {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Get payment status display text
 * @param {string} state - Payment state
 * @returns {string} Display text
 */
const getPaymentStatusDisplay = (state) => {
  const stateMap = {
    'COMPLETED': 'Payment Successful',
    'INITIATED': 'Payment Initiated',
    'FAILED': 'Payment Failed',
    'PENDING': 'Pending',
  };
  return stateMap[state] || state;
};

/**
 * Validate payment amount
 * @param {number} amount - Amount to validate
 * @returns {object} {valid: boolean, error: string}
 */
const validatePaymentAmount = (amount) => {
  if (!amount || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a number' };
  }

  const numAmount = parseFloat(amount);

  if (numAmount < 1) {
    return { valid: false, error: 'Minimum amount is ₹1' };
  }

  if (numAmount > 100000) {
    return { valid: false, error: 'Maximum amount is ₹100,000' };
  }

  return { valid: true };
};

// Export all functions at once
export {
  formatPaymentAmount,
  getPaymentStatusDisplay,
  validatePaymentAmount,
};
