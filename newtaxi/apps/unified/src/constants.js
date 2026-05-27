import { Platform } from 'react-native';

export const COLORS = {
  // Primary colors
  primary: '#e94560',
  primaryDark: '#d63851',
  primaryLight: '#ff6b85',
  
  // Secondary colors
  secondary: '#0f3460',
  secondaryDark: '#0a2a4f',
  secondaryLight: '#16426b',
  
  // Background colors
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceVariant: '#f1f3f4',
  
  // Text colors
  text: '#212529',
  textSecondary: '#6c757d',
  textLight: '#ffffff',
  
  // Status colors
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
  
  // Border and divider
  border: '#dee2e6',
  divider: '#e9ecef',
  
  // Specific app colors
  superAdmin: {
    primary: '#6c5ce7',
    secondary: '#a29bfe',
    background: '#f8f9fa',
    surface: '#ffffff',
  },
  vendor: {
    primary: '#0f3460',
    secondary: '#e94560',
    background: '#f8f9fa',
    surface: '#ffffff',
  },
  driver: {
    primary: '#1a1a2e',
    secondary: '#e94560',
    background: '#f8f9fa',
    surface: '#ffffff',
  }
};

// API Configuration - automatically detect the correct URL based on platform
const getApiUrl = () => {
  // For physical devices using Expo Go, use your machine's IP address
  const MACHINE_IP = '10.199.110.178'; // Your machine's IP address
  
  if (Platform.OS === 'android') {
    // Use machine IP for physical devices
    return `http://${MACHINE_IP}:4000`;
  } else if (Platform.OS === 'ios') {
    // iOS simulator uses localhost
    return 'http://localhost:4000';
  } else {
    // Web uses localhost
    return 'http://localhost:4000';
  }
};

export const API_CONFIG = {
  SMS_API_URL: getApiUrl(),
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  VENDOR: 'vendor',
  DRIVER: 'driver'
};

export const TRIP_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const PAYMENT_GATEWAYS = {
  RAZORPAY: 'razorpay',
  PHONEPE: 'phonepe',
};

export const COMMISSION_RATES = {
  VENDOR: 0.10, // 10%
  DRIVER: 0.15  // 15%
};

export const TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  COMMISSION: 'commission',
  WITHDRAWAL: 'withdrawal',
  REFUND: 'refund',
};

export const MIN_WALLET_BALANCE = 100;
export const VENDOR_WINDOW_MS = 15 * 60 * 1000; // 15 minutes vendor window

export const STORAGE_BUCKETS = {
  ODOMETER: 'odometer-images',
  DOCUMENTS: 'documents',
  PROFILES: 'profile-photos',
};

export const COMMISSION_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
};