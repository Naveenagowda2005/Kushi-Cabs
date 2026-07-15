require('dotenv').config();
console.log('🔧 Environment loaded');

const express = require('express');
console.log('📦 Express loaded');

const cors = require('cors');
console.log('📦 CORS loaded');

const smsRouter = require('./routes/sms');
console.log('📦 SMS router loaded');

const app = express();
const port = process.env.PORT || 8080;
console.log(`🔧 Configured port: ${port}`);

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint - MUST be first
app.get('/health', (req, res) => {
  console.log('📊 Health check ping received');
  res.status(200).json({ 
    status: 'ok', 
    service: 'taxi-sms-backend', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes with request logging
app.use('/sms', (req, res, next) => {
  console.log(`📨 SMS Request: ${req.method} ${req.path}`);
  next();
}, smsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Taxi SMS backend listening on http://127.0.0.1:${port}`);
  console.log(`✅ Access from phone at: http://192.168.1.110:${port}`);
  console.log(`📱 API endpoints:`);
  console.log(`   - POST /sms/otp - Send OTP`);
  console.log(`   - POST /sms/verify - Verify OTP`);
  console.log(`   - GET /health - Health check`);
  console.log(`🟢 SERVICE READY FOR REQUESTS`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use!`);
  }
});

// Handle uncaught exceptions but don't exit immediately
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
});

// Handle unhandled promise rejections but don't exit immediately
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

