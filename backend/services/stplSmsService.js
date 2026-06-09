const axios = require('axios');

const {
  STPL_API_URL,
  STPL_API_KEY,
  STPL_USERNAME,
  STPL_PASSWORD,
  STPL_SENDER_ID,
  STPL_ROUTE,
  STPL_ROUTE_ID,
  STPL_COUNTRY_CODE,
  STPL_CAMPAIGN = 0,
  STPL_OTP_TEMPLATE_ID,
  STPL_API_QUERY_KEY_FIELD = 'key',
  STPL_API_QUERY_MOBILE_FIELD = 'contacts',
  STPL_API_QUERY_MESSAGE_FIELD = 'msg',
  STPL_API_QUERY_SENDER_FIELD = 'senderid',
  STPL_API_QUERY_USERNAME_FIELD = 'user',
  STPL_API_QUERY_PASSWORD_FIELD = 'passwd',
  STPL_API_QUERY_ROUTE_FIELD = 'routeid',
  STPL_API_QUERY_TYPE_FIELD = 'type',
  STPL_API_QUERY_TYPE_VALUE = 'text',
  STPL_API_QUERY_CAMPAIGN_FIELD = 'campaign',
  STPL_API_QUERY_TEMPLATE_FIELD = 'template_id',
  STPL_API_QUERY_COUNTRY_FIELD = 'country',
} = process.env;

// Log missing variables for debugging on Railway - don't crash on startup
if (!STPL_API_URL) {
  console.error('⚠️  STPL_API_URL is not configured - SMS sending will fail');
}
if (!STPL_SENDER_ID) {
  console.error('⚠️  STPL_SENDER_ID is not configured - SMS sending will fail');
}
if (!STPL_API_KEY && (!STPL_USERNAME || !STPL_PASSWORD)) {
  console.error('⚠️  SMS credentials not configured - SMS sending will fail');
}

function normalizeRecipients(to) {
  if (!to) {
    return [];
  }
  if (Array.isArray(to)) {
    return to.map(String).map((recipient) => recipient.replace(/[^0-9]/g, '')).filter(Boolean);
  }
  return String(to).split(',').map((recipient) => recipient.replace(/[^0-9]/g, '')).filter(Boolean);
}

async function sendSms({ to, message, senderId, isOtp = false }) {
  const recipients = normalizeRecipients(to);
  if (!recipients.length) {
    throw new Error('Missing destination phone number(s)');
  }
  if (!message || !message.trim()) {
    throw new Error('Missing SMS message body');
  }

  // Validate SMS configuration before sending
  if (!STPL_API_URL) {
    throw new Error('SMS service not configured: STPL_API_URL is missing');
  }

  const finalSender = senderId || STPL_SENDER_ID;
  if (!finalSender) {
    throw new Error('SMS sender ID not configured: STPL_SENDER_ID is required');
  }

  const params = {
    [STPL_API_QUERY_SENDER_FIELD]: finalSender,
    [STPL_API_QUERY_MESSAGE_FIELD]: message,
    [STPL_API_QUERY_MOBILE_FIELD]: recipients.join(','),
  };

  if (STPL_API_KEY) {
    params[STPL_API_QUERY_KEY_FIELD] = STPL_API_KEY;
  } else {
    params[STPL_API_QUERY_USERNAME_FIELD] = STPL_USERNAME;
    params[STPL_API_QUERY_PASSWORD_FIELD] = STPL_PASSWORD;
  }

  if (STPL_API_QUERY_TYPE_FIELD && STPL_API_QUERY_TYPE_VALUE) {
    params[STPL_API_QUERY_TYPE_FIELD] = STPL_API_QUERY_TYPE_VALUE;
  }
  // Don't send campaign if it's 0
  if (STPL_API_QUERY_CAMPAIGN_FIELD && STPL_CAMPAIGN && STPL_CAMPAIGN !== '0') {
    params[STPL_API_QUERY_CAMPAIGN_FIELD] = STPL_CAMPAIGN;
  }
  if (STPL_ROUTE_ID) {
    params[STPL_API_QUERY_ROUTE_FIELD] = STPL_ROUTE_ID;
  } else if (STPL_ROUTE) {
    params[STPL_API_QUERY_ROUTE_FIELD] = STPL_ROUTE;
  }
  
  // Add template ID for OTP messages
  if (isOtp && STPL_OTP_TEMPLATE_ID && STPL_API_QUERY_TEMPLATE_FIELD) {
    params[STPL_API_QUERY_TEMPLATE_FIELD] = STPL_OTP_TEMPLATE_ID;
    console.log(`📋 Using OTP Template ID: ${STPL_OTP_TEMPLATE_ID}`);
  }

  console.log(`🔄 Sending SMS to ${recipients.join(',')} with params:`, params);
  
  try {
    const response = await axios.post(STPL_API_URL, null, { params, timeout: 20000 });
    console.log(`✅ SMS API Response:`, response.status, response.data);
    return {
      status: response.status,
      data: response.data,
      params,
    };
  } catch (error) {
    console.error(`❌ SMS API Error:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

module.exports = {
  sendSms,
};
