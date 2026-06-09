const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const otpStore = new Map();
const ttlSeconds = Number(process.env.OTP_TTL_SECONDS || 300);

// Initialize Supabase for persistent OTP storage
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateOtp(length = 6) {
  const digits = '0123456789';
  return Array.from({ length }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
}

function getCacheKey(phone) {
  return String(phone).replace(/[^0-9]/g, '');
}

async function createOtp(phone) {
  const key = getCacheKey(phone);
  const otp = generateOtp(6);
  const expiresAt = Date.now() + ttlSeconds * 1000;
  
  // Store in memory
  otpStore.set(key, { otp, expiresAt });
  
  // Also store in Supabase for persistence across server restarts
  try {
    await supabase
      .from('otp_verification')
      .upsert({
        phone_number: key,
        otp_code: otp,
        expires_at: new Date(expiresAt).toISOString(),
        created_at: new Date().toISOString(),
        verified: false
      }, {
        onConflict: 'phone_number'
      });
  } catch (error) {
    console.warn('⚠️  Failed to store OTP in Supabase:', error.message);
    // Still return OTP even if DB fails - memory store is enough
  }
  
  console.log(`📧 OTP created for ${key}: ${otp}`);
  return otp;
}

async function verifyOtp(phone, otp) {
  const key = getCacheKey(phone);
  console.log(`🔍 Verifying OTP for ${key}: ${otp}`);
  
  // First check memory store
  const entry = otpStore.get(key);
  if (entry) {
    console.log('✓ Found in memory store');
    if (Date.now() > entry.expiresAt) {
      console.log('❌ OTP expired (in memory)');
      otpStore.delete(key);
      return false;
    }
    const isValid = entry.otp === String(otp).trim();
    if (isValid) {
      console.log('✅ OTP valid (in memory)');
      otpStore.delete(key);
      return true;
    }
  }
  
  // If not in memory, check Supabase (in case server restarted)
  try {
    const { data, error } = await supabase
      .from('otp_verification')
      .select('*')
      .eq('phone_number', key)
      .eq('verified', false)
      .single();
    
    if (error) {
      console.log('⚠️  OTP not found in database:', error.message);
      return false;
    }
    
    if (!data) {
      console.log('❌ No OTP record found');
      return false;
    }
    
    // Check expiration
    if (new Date() > new Date(data.expires_at)) {
      console.log('❌ OTP expired (in database)');
      // Mark as expired
      await supabase
        .from('otp_verification')
        .update({ verified: false })
        .eq('phone_number', key);
      return false;
    }
    
    // Check OTP match
    const isValid = data.otp_code === String(otp).trim();
    if (isValid) {
      console.log('✅ OTP valid (from database)');
      // Mark as verified
      await supabase
        .from('otp_verification')
        .update({ verified: true })
        .eq('phone_number', key);
      return true;
    }
    
    console.log('❌ OTP mismatch');
    return false;
  } catch (error) {
    console.error('❌ Database error during verification:', error.message);
    // Fallback to just checking memory
    return false;
  }
}

module.exports = {
  createOtp,
  verifyOtp,
};
