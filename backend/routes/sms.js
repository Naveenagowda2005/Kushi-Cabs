const express = require('express');
const { sendSms } = require('../services/stplSmsService');
const { createOtp, verifyOtp } = require('../services/otpService');

const router = express.Router();

// Handle CORS preflight for all routes
router.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

router.post('/send', async (req, res, next) => {
  try {
    const { to, message, senderId } = req.body;
    const result = await sendSms({ to, message, senderId });
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

router.post('/otp', async (req, res, next) => {
  try {
    const { to, purpose = 'verification' } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, otpSent: false, error: 'Missing destination phone number' });
    }

    // Create OTP - returns a string
    const otp = createOtp(to);
    const otpString = String(otp).trim();
    
    const ttlMinutes = Math.max(1, Math.floor(Number(process.env.OTP_TTL_SECONDS || 300) / 60));
    // OTP message matching the registered template exactly
    const text = `${otpString} is your Kushi Cabs OTP. Do not share with anyone.`;
    
    console.log(`📧 OTP created for ${to}: ${otpString}`);
    console.log(`📝 SMS Text: ${text}`);
    
    const result = await sendSms({ to, message: text, isOtp: true });

    // Add CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    res.json({ 
      success: true, 
      otpSent: true, 
      purpose, 
      otp: otpString, 
      result,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { to, otp } = req.body;
    console.log(`🔍 Verifying OTP for ${to}: ${otp}`);
    
    if (!to || !otp) {
      console.log(`❌ Missing phone or OTP`);
      return res.status(400).json({ success: false, verified: false, error: 'Missing phone number or OTP' });
    }

    const verified = verifyOtp(to, otp);
    console.log(`✅ OTP Verification result: ${verified}`);
    
    // Add headers for CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    res.json({ 
      success: verified, 
      verified: verified,
      message: verified ? 'OTP verified successfully' : 'Invalid OTP'
    });
  } catch (error) {
    console.error(`❌ Verify error:`, error);
    next(error);
  }
});

module.exports = router;
