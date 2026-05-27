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

if (!STPL_API_URL) {
  throw new Error('STPL_API_URL is required in environment configuration');
}

if (!STPL_API_KEY && (!STPL_USERNAME || !STPL_PASSWORD)) {
  throw new Error('Either STPL_API_KEY or STPL_USERNAME and STPL_PASSWORD must be configured');
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

  const finalSender = senderId || STPL_SENDER_ID;
  if (!finalSender) {
    throw new Error('STPL_SENDER_ID must be configured for SMS sending');
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
  }
  
  // Don't send country code - let HiTech use default
  // if (STPL_API_QUERY_COUNTRY_FIELD && STPL_COUNTRY_CODE) {
  //   params[STPL_API_QUERY_COUNTRY_FIELD] = STPL_COUNTRY_CODE;
  // }

  const response = await axios.post(STPL_API_URL, null, { params, timeout: 20000 });
  return {
    status: response.status,
    data: response.data,
    params,
  };
}

module.exports = {
  sendSms,
};
