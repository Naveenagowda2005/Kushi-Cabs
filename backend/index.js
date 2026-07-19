const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
console.log('🔧 Environment loaded');
console.log(`ℹ️  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓ loaded' : '✗ missing'}`);
console.log(`ℹ️  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ loaded' : '✗ missing'}`);

const express = require('express');
console.log('📦 Express loaded');

const cors = require('cors');
console.log('📦 CORS loaded');

const smsRouter = require('./routes/sms');
console.log('📦 SMS router loaded');

const adminRouter = require('./routes/admin');
console.log('📦 Admin router loaded');

const storageMigrationRouter = require('./routes/storage-migration');
console.log('📦 Storage migration router loaded');

const documentUploadRouter = require('./routes/document-upload');
console.log('📦 Document upload router loaded');

const databaseOptimizationRouter = require('./routes/database-optimization');
console.log('📦 Database optimization router loaded');

const tripsRouter = require('./routes/trips');
console.log('📦 Trips router loaded');

const app = express();
const port = process.env.PORT || 4000;
console.log(`🔧 Configured port: ${port}`);

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase payload size limit for large base64 images (default is 100kb)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

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

app.use('/admin', (req, res, next) => {
  console.log(`🔧 Admin Request: ${req.method} ${req.path}`);
  next();
}, adminRouter);

app.use('/api/storage-migration', (req, res, next) => {
  console.log(`💾 Storage Migration Request: ${req.method} ${req.path}`);
  next();
}, storageMigrationRouter);

app.use('/api/upload', (req, res, next) => {
  console.log(`📤 Document Upload Request: ${req.method} ${req.path}`);
  next();
}, documentUploadRouter);

app.use('/api/db-optimization', (req, res, next) => {
  console.log(`🔧 Database Optimization Request: ${req.method} ${req.path}`);
  next();
}, databaseOptimizationRouter);

app.use('/api/trips', (req, res, next) => {
  console.log(`📄 Trips Request: ${req.method} ${req.path}`);
  next();
}, tripsRouter);

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
const server = app.listen(port, '192.168.1.114', () => {
  console.log(`✅ Taxi SMS backend listening on http://192.168.1.114:${port}`);
  console.log(`✅ Access from phone at: http://192.168.1.114:${port}`);
  console.log(`📱 API endpoints:`);
  console.log(`   - POST /sms/otp - Send OTP`);
  console.log(`   - POST /sms/verify - Verify OTP`);
  console.log(`   - POST /admin/create-driver-account - Create driver account`);
  console.log(`   - POST /admin/create-dummy-driver - Create dummy driver`);
  console.log(`   - GET /admin/dummy-drivers - List dummy drivers`);
  console.log(`   - POST /admin/create-dummy-vendor - Create dummy vendor`);
  console.log(`   - GET /admin/dummy-vendors - List dummy vendors`);
  console.log(`   - POST /admin/delete-user - Delete user`);
  console.log(`   - POST /admin/update-admin-phone - Update admin phone`);
  console.log(`   - GET /admin/user/:userId - Get user info`);
  console.log(`   - POST /api/storage-migration/migrate-documents - Migrate docs to storage`);
  console.log(`   - POST /api/storage-migration/migrate-avatars - Migrate avatars to storage`);
  console.log(`   - GET /api/storage-migration/status - Migration status`);
  console.log(`   - POST /api/upload/upload-document - Upload document to bucket`);
  console.log(`   - POST /api/upload/upload-avatar - Upload avatar to bucket`);
  console.log(`   - GET /health - Health check`);
  console.log(`   - POST /api/db-optimization/apply-trips-indexes - Apply trips table indexes`);
  console.log(`   - GET /api/db-optimization/verify-trips-indexes - Verify indexes exist`);
  console.log(`   - GET /api/db-optimization/trips-table-stats - Check trips table row count`);
  console.log(`   - GET /api/trips/list - Get paginated trips`);
  console.log(`   - GET /api/trips/count-by-status - Get trip counts by status`);
  console.log(`   - GET /api/trips/quick-count - Get total trip count`);
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

