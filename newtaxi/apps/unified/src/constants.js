import { Platform } from 'react-native';

export const COLORS = {
  // Primary colors - Techboom Design System
  primary: '#9333ea',           // Primary Purple
  primaryDark: '#7e22ce',       // Purple-700
  primaryLight: '#a855f7',      // Purple-500
  
  // Accent colors
  accent: '#eab308',            // Accent Yellow
  accentDark: '#d97706',        // Yellow-600
  accentLight: '#fbbf24',       // Yellow-400
  
  // Background colors - Dark theme
  background: '#0f0a1e',        // Dark Background
  backgroundSecondary: '#1a1530', // Secondary Dark Background
  backgroundTertiary: '#0a0618',  // Tertiary Dark Background
  surface: '#1a1530',           // Surface (slightly lighter than bg)
  surfaceVariant: 'rgba(255, 255, 255, 0.05)',
  
  // Text colors
  text: '#ffffff',              // White Text
  textSecondary: 'rgba(255, 255, 255, 0.7)',  // Muted White (70%)
  textTertiary: 'rgba(255, 255, 255, 0.5)',   // Muted White (50%)
  textDisabled: 'rgba(255, 255, 255, 0.3)',   // Muted White (30%)
  textLight: '#ffffff',
  
  // Status colors
  success: '#22c55e',           // Green
  warning: '#f97316',           // Orange
  error: '#ef4444',             // Red
  info: '#9333ea',              // Purple
  
  // Border and divider
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderStrong: 'rgba(147, 51, 234, 0.3)',
  divider: 'rgba(255, 255, 255, 0.1)',
  
  // Glass morphism
  glass: 'rgba(255, 255, 255, 0.02)',
  glassHover: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Glow effects
  glowPurple: 'rgba(147, 51, 234, 0.3)',
  glowPurpleLg: 'rgba(147, 51, 234, 0.6)',
  glowYellow: 'rgba(234, 179, 8, 0.3)',
  
  // Extended Purple Shades
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Extended Yellow Shades
  yellow: {
    50: '#fefce8',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Extended Gray Shades
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Extended Dark Shades
  dark: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Status color variations
  successLight: 'rgba(34, 197, 94, 0.1)',
  successBorder: 'rgba(34, 197, 94, 0.3)',
  warningLight: 'rgba(249, 115, 22, 0.1)',
  warningBorder: 'rgba(249, 115, 22, 0.3)',
  errorLight: 'rgba(239, 68, 68, 0.1)',
  errorBorder: 'rgba(239, 68, 68, 0.3)',
  infoLight: 'rgba(147, 51, 234, 0.1)',
  infoBorder: 'rgba(147, 51, 234, 0.3)',
  
  // Button states
  buttonPrimaryBg: 'rgba(147, 51, 234, 0.1)',
  buttonPrimaryBgHover: 'rgba(147, 51, 234, 0.15)',
  buttonPrimaryBorder: 'rgba(147, 51, 234, 0.3)',
  buttonPrimaryBorderHover: 'rgba(147, 51, 234, 0.6)',
  buttonPrimaryGlow: '0 0 20px rgba(147, 51, 234, 0.2)',
  buttonPrimaryGlowHover: '0 0 30px rgba(147, 51, 234, 0.4)',
  
  buttonSecondaryBg: 'rgba(234, 179, 8, 0.1)',
  buttonSecondaryBorder: 'rgba(234, 179, 8, 0.3)',
  buttonSecondaryGlow: '0 0 20px rgba(234, 179, 8, 0.2)',
  
  buttonDisabledBg: 'rgba(255, 255, 255, 0.05)',
  buttonDisabledText: 'rgba(255, 255, 255, 0.4)',
  buttonDisabledBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Card styles
  cardBg: 'rgba(255, 255, 255, 0.02)',
  cardBorder: 'rgba(147, 51, 234, 0.3)',
  cardShadow: '0 0 20px rgba(147, 51, 234, 0.1)',
  cardBgHover: 'rgba(255, 255, 255, 0.05)',
  cardBorderHover: 'rgba(147, 51, 234, 0.6)',
  cardShadowHover: '0 20px 50px rgba(147, 51, 234, 0.3)',
  
  // Input styles
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  inputBorderFocus: 'rgba(147, 51, 234, 0.6)',
  inputGlowFocus: '0 0 20px rgba(147, 51, 234, 0.2)',
  inputPlaceholder: 'rgba(255, 255, 255, 0.3)',
  
  // Badge styles
  badgePurpleBg: 'rgba(147, 51, 234, 0.2)',
  badgePurpleText: '#9333ea',
  badgePurpleBorder: 'rgba(147, 51, 234, 0.4)',
  
  badgeYellowBg: 'rgba(234, 179, 8, 0.2)',
  badgeYellowText: '#eab308',
  badgeYellowBorder: 'rgba(234, 179, 8, 0.4)',
  
  badgeGreenBg: 'rgba(34, 197, 94, 0.2)',
  badgeGreenText: '#22c55e',
  badgeGreenBorder: 'rgba(34, 197, 94, 0.4)',
  
  badgeRedBg: 'rgba(239, 68, 68, 0.2)',
  badgeRedText: '#ef4444',
  badgeRedBorder: 'rgba(239, 68, 68, 0.4)',
  
  badgeOrangeBg: 'rgba(249, 115, 22, 0.2)',
  badgeOrangeText: '#f97316',
  badgeOrangeBorder: 'rgba(249, 115, 22, 0.4)',
  
  // Specific app colors - Updated to match design system
  superAdmin: {
    primary: '#9333ea',         // Purple
    secondary: '#a855f7',       // Purple-500
    background: '#0f0a1e',
    surface: '#1a1530',
    accent: '#eab308',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
  },
  vendor: {
    primary: '#9333ea',         // Purple
    secondary: '#a855f7',       // Purple-500
    background: '#0f0a1e',
    surface: '#1a1530',
    accent: '#eab308',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
  },
  driver: {
    primary: '#9333ea',         // Purple
    secondary: '#a855f7',       // Purple-500
    background: '#0f0a1e',
    surface: '#1a1530',
    accent: '#eab308',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
  }
};

// API Configuration - automatically detect the correct URL based on platform
const getApiUrl = () => {
  // For physical devices using Expo Go, use your machine's IP address
  const MACHINE_IP = '192.168.1.111'; // Your machine's IP address
  
  if (Platform.OS === 'android') {
    // Use Railway production URL for all builds
    return 'https://your-railway-app-url.railway.app';
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