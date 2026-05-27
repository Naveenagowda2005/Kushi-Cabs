// Notifications will be replaced with SMS integration via backend
// If EXPO_PUBLIC_SMS_BACKEND_URL is configured, notifications will be posted to the backend SMS service.

const SMS_BACKEND_URL = process.env.EXPO_PUBLIC_SMS_BACKEND_URL;

export async function registerForPushNotifications(userId) {
  // SMS will be sent via backend API - no device registration needed
  console.log('SMS notifications enabled for user:', userId);
  return null;
}

async function postSmsMessage({ title, body, data }) {
  if (!SMS_BACKEND_URL) {
    console.log('SMS backend is not configured. Notification dropped:', { title, body, data });
    return null;
  }

  const payload = {
    to: data?.phone || data?.mobile || data?.recipient,
    message: `${title}\n${body}`,
  };

  if (!payload.to) {
    console.log('SMS backend request skipped because no recipient is configured:', { title, body, data });
    return null;
  }

  const response = await fetch(`${SMS_BACKEND_URL.replace(/\/$/, '')}/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SMS backend error: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function sendLocalNotification({ title, body, data = {} }) {
  try {
    if (SMS_BACKEND_URL) {
      return await postSmsMessage({ title, body, data });
    }

    // SMS will be sent via backend API when configured
    console.log('Notification queued for SMS:', { title, body, data });
    return null;
  } catch (err) {
    console.log('Local notification skipped:', err.message);
    return null;
  }
}

// Vendor notifications
export function notifyNewEnquiry(trip) {
  return sendLocalNotification({
    title: '📋 New Trip Enquiry',
    body: `${trip.pickup_location} → ${trip.dropoff_location}  ₹${trip.fare_amount}`,
    data: { type: 'new_enquiry', tripId: trip.id },
  });
}

export function notifyEnquiryAccepted() {
  return sendLocalNotification({
    title: '✅ Enquiry Accepted',
    body: 'You have successfully accepted the trip enquiry.',
    data: { type: 'enquiry_accepted' },
  });
}

export function notifyCommissionEarned(amount) {
  return sendLocalNotification({
    title: '💰 Commission Earned',
    body: `₹${Number(amount).toFixed(2)} commission added to your wallet.`,
    data: { type: 'commission' },
  });
}

export function notifyWithdrawalSuccess(amount) {
  return sendLocalNotification({
    title: '🏦 Withdrawal Processed',
    body: `₹${Number(amount).toFixed(2)} has been withdrawn from your wallet.`,
    data: { type: 'withdrawal' },
  });
}

// Driver notifications
export function notifyNewTrip(trip) {
  return sendLocalNotification({
    title: '🚗 New Trip Available',
    body: `${trip.pickup_location} → ${trip.dropoff_location}  ₹${trip.fare_amount}`,
    data: { type: 'new_trip', tripId: trip.id },
  });
}

export function notifyTripAccepted(trip) {
  return sendLocalNotification({
    title: '✅ Trip Accepted',
    body: `Your trip to ${trip.dropoff_location} is confirmed.`,
    data: { type: 'trip_accepted', tripId: trip.id },
  });
}

export function notifyWalletUpdate(balance) {
  return sendLocalNotification({
    title: '💰 Wallet Updated',
    body: `Your new balance is ₹${Number(balance).toFixed(2)}`,
    data: { type: 'wallet_update' },
  });
}

export function notifyLowBalance(balance, minBalance) {
  return sendLocalNotification({
    title: '⚠️ Low Wallet Balance',
    body: `Balance ₹${Number(balance).toFixed(2)} is below the ₹${minBalance} minimum.`,
    data: { type: 'low_balance' },
  });
}