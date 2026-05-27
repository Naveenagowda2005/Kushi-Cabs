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

    const otp = createOtp(to);
    const ttlMinutes = Math.max(1, Math.floor(Number(process.env.OTP_TTL_SECONDS || 300) / 60));
    // OTP message matching the registered template exactly
    const text = `${otp} is your Kushi Cabs OTP. Do not share with anyone.`;
    const result = await sendSms({ to, message: text, isOtp: true });

    res.json({ success: true, otpSent: true, purpose, result });
  } catch (error) {
    next(error);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { to, otp } = req.body;
    if (!to || !otp) {
      return res.status(400).json({ success: false, error: 'Missing phone number or OTP' });
    }

    const verified = verifyOtp(to, otp);
    res.json({ success: verified, verified });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
