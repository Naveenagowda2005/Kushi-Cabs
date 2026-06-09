const crypto = require('crypto');

const otpStore = new Map();
const ttlSeconds = Number(process.env.OTP_TTL_SECONDS || 300);

function generateOtp(length = 6) {
  const digits = '0123456789';
  return Array.from({ length }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
}

function getCacheKey(phone) {
  return String(phone).replace(/[^0-9]/g, '');
}

function createOtp(phone) {
  const key = getCacheKey(phone);
  const otp = generateOtp(6);
  const expiresAt = Date.now() + ttlSeconds * 1000;
  otpStore.set(key, { otp, expiresAt });
  return otp;
}

function verifyOtp(phone, otp) {
  const key = getCacheKey(phone);
  const entry = otpStore.get(key);
  if (!entry) {
    return false;
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  const isValid = entry.otp === String(otp).trim();
  if (isValid) {
    otpStore.delete(key);
  }
  return isValid;
}

module.exports = {
  createOtp,
  verifyOtp,
};
