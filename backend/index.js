require('dotenv').config();
console.log('🔧 Environment loaded');

const express = require('express');
console.log('📦 Express loaded');

const cors = require('cors');
console.log('📦 CORS loaded');

const smsRouter = require('./routes/sms');
console.log('📦 SMS router loaded');

const adminRouter = require('./routes/admin');
console.log('📦 Admin router loaded');

const app = express();
const port = process.env.PORT || 4000;

// Enable CORS for all origins during development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'taxi-sms-backend', timestamp: new Date().toISOString() });
});

// API Routes with request logging
app.use('/sms', (req, res, next) => {
  console.log(`📨 SMS Request: ${req.method} ${req.path}`);
  next();
}, smsRouter);

app.use('/admin', (req, res, next) => {
  console.log(`👤 Admin Request: ${req.method} ${req.path}`);
  next();
}, adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Taxi SMS backend listening on http://127.0.0.1:${port}`);
  console.log(`✅ Access from phone at: http://RAILWAY_DEPLOYMENT:${port}`);
  console.log(`📱 API endpoints:`);
  console.log(`   - POST /sms/otp - Send OTP`);
  console.log(`   - POST /sms/verify - Verify OTP`);
  console.log(`   - POST /admin/delete-user - Delete user`);
  console.log(`   - POST /admin/update-admin-phone - Update admin phone`);
  console.log(`   - GET /admin/user/:userId - Get user info`);
  console.log(`   - GET /health - Health check`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use!`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});

