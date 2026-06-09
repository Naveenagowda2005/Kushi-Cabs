const express = require('express');
const { sendSms } = require('../services/stplSmsService');
const { createOtp, verifyOtp } = require('../services/otpService');

const router = express.Router();

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
      return res.status(400).json({ success: false, error: 'Missing destination phone number' });
    }

    // IMPORTANT: createOtp is now async, must await it!
    const otp = await createOtp(to);
    const ttlMinutes = Math.max(1, Math.floor(Number(process.env.OTP_TTL_SECONDS || 300) / 60));
    
    // OTP is now a real string, not a Promise
    const text = `${otp} is your Kushi Cabs OTP`;
    
    console.log(`📱 Sending OTP: ${otp} to ${to}`);
    console.log(`📨 Message: ${text}`);
    
    const result = await sendSms({ to, message: text, isOtp: true });

    console.log(`✅ SMS Send Result:`, result);
    res.json({ success: true, otpSent: true, purpose, result });
  } catch (error) {
    console.error(`❌ SMS Send Error:`, error);
    next(error);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { to, otp } = req.body;
    console.log(`🔐 Verify OTP Request: phone=${to}, otp=${otp}`);
    
    if (!to || !otp) {
      console.error('❌ Missing phone or OTP');
      return res.status(400).json({ success: false, error: 'Missing phone number or OTP' });
    }

    const verified = verifyOtp(to, otp);
    console.log(`✅ OTP Verification Result: ${verified ? 'SUCCESS' : 'FAILED'}`);
    
    res.json({ 
      success: verified, 
      verified,
      message: verified ? 'OTP verified successfully' : 'Invalid or expired OTP'
    });
  } catch (error) {
    console.error('❌ OTP Verify Error:', error);
    next(error);
  }
});

module.exports = router;
