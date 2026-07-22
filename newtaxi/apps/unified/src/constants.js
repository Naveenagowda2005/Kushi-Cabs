import { Platform } from 'react-native';

// Default dark theme (original colors)
const DARK_THEME = {
  // Primary colors - Techboom Design System
  primary: '#9333ea',
  primaryDark: '#7e22ce',
  primaryLight: '#a855f7',
  
  accent: '#eab308',
  accentDark: '#d97706',
  accentLight: '#fbbf24',
  
  background: '#0f0a1e',
  backgroundSecondary: '#1a1530',
  backgroundTertiary: '#0a0618',
  surface: '#1a1530',
  surfaceVariant: 'rgba(255, 255, 255, 0.05)',
  
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textDisabled: 'rgba(255, 255, 255, 0.3)',
  textLight: '#ffffff',
  
  success: '#22c55e',
  warning: '#f97316',
  error: '#ef4444',
  info: '#9333ea',
  
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderStrong: 'rgba(147, 51, 234, 0.3)',
  divider: 'rgba(255, 255, 255, 0.1)',
  
  glass: 'rgba(255, 255, 255, 0.02)',
  glassHover: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  
  glowPurple: 'rgba(147, 51, 234, 0.3)',
  glowPurpleLg: 'rgba(147, 51, 234, 0.6)',
  glowYellow: 'rgba(234, 179, 8, 0.3)',

  successLight: 'rgba(34, 197, 94, 0.1)',
  successBorder: 'rgba(34, 197, 94, 0.3)',
  warningLight: 'rgba(249, 115, 22, 0.1)',
  warningBorder: 'rgba(249, 115, 22, 0.3)',
  errorLight: 'rgba(239, 68, 68, 0.1)',
  errorBorder: 'rgba(239, 68, 68, 0.3)',
  infoLight: 'rgba(147, 51, 234, 0.1)',
  infoBorder: 'rgba(147, 51, 234, 0.3)',
  
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
  
  cardBg: 'rgba(255, 255, 255, 0.02)',
  cardBorder: 'rgba(147, 51, 234, 0.3)',
  cardShadow: '0 0 20px rgba(147, 51, 234, 0.1)',
  cardBgHover: 'rgba(255, 255, 255, 0.05)',
  cardBorderHover: 'rgba(147, 51, 234, 0.6)',
  cardShadowHover: '0 20px 50px rgba(147, 51, 234, 0.3)',
  
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  inputBorderFocus: 'rgba(147, 51, 234, 0.6)',
  inputGlowFocus: '0 0 20px rgba(147, 51, 234, 0.2)',
  inputPlaceholder: 'rgba(255, 255, 255, 0.3)',
  
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
  
  superAdmin: {
    primary: '#9333ea',
    secondary: '#a855f7',
    background: '#0f0a1e',
    surface: '#1a1530',
    accent: '#eab308',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
  },
  vendor: {
    primary: '#9333ea',
    secondary: '#a855f7',
    background: '#0f0a1e',
    surface: '#1a1530',
    accent: '#eab308',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
  },
  driver: {
    primary: '#9333ea',
    secondary: '#a855f7',
    background: '#0f0a1e',
    surface: '#1a1530',
    accent: '#eab308',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
  }
};

// Light theme
const LIGHT_THEME = {
  primary: '#9333ea',
  primaryDark: '#7e22ce',
  primaryLight: '#a855f7',
  
  accent: '#eab308',
  accentDark: '#d97706',
  accentLight: '#fbbf24',
  
  background: '#f5f5f5',
  backgroundSecondary: '#e8e8e8',
  backgroundTertiary: '#f0f0f0',
  surface: '#ffffff',
  surfaceVariant: 'rgba(0, 0, 0, 0.05)',
  
  text: '#1a1a1a',
  textSecondary: 'rgba(0, 0, 0, 0.7)',
  textTertiary: 'rgba(0, 0, 0, 0.5)',
  textDisabled: 'rgba(0, 0, 0, 0.3)',
  textLight: '#1a1a1a',
  
  success: '#22c55e',
  warning: '#f97316',
  error: '#ef4444',
  info: '#9333ea',
  
  border: 'rgba(0, 0, 0, 0.1)',
  borderLight: 'rgba(0, 0, 0, 0.05)',
  borderStrong: 'rgba(147, 51, 234, 0.2)',
  divider: 'rgba(0, 0, 0, 0.1)',
  
  glass: 'rgba(0, 0, 0, 0.02)',
  glassHover: 'rgba(0, 0, 0, 0.05)',
  glassBorder: 'rgba(0, 0, 0, 0.1)',
  
  glowPurple: 'rgba(147, 51, 234, 0.3)',
  glowPurpleLg: 'rgba(147, 51, 234, 0.6)',
  glowYellow: 'rgba(234, 179, 8, 0.3)',

  successLight: 'rgba(34, 197, 94, 0.1)',
  successBorder: 'rgba(34, 197, 94, 0.3)',
  warningLight: 'rgba(249, 115, 22, 0.1)',
  warningBorder: 'rgba(249, 115, 22, 0.3)',
  errorLight: 'rgba(239, 68, 68, 0.1)',
  errorBorder: 'rgba(239, 68, 68, 0.3)',
  infoLight: 'rgba(147, 51, 234, 0.1)',
  infoBorder: 'rgba(147, 51, 234, 0.3)',
  
  buttonPrimaryBg: 'rgba(147, 51, 234, 0.1)',
  buttonPrimaryBgHover: 'rgba(147, 51, 234, 0.15)',
  buttonPrimaryBorder: 'rgba(147, 51, 234, 0.3)',
  buttonPrimaryBorderHover: 'rgba(147, 51, 234, 0.6)',
  buttonPrimaryGlow: '0 0 20px rgba(147, 51, 234, 0.2)',
  buttonPrimaryGlowHover: '0 0 30px rgba(147, 51, 234, 0.4)',
  
  buttonSecondaryBg: 'rgba(234, 179, 8, 0.1)',
  buttonSecondaryBorder: 'rgba(234, 179, 8, 0.3)',
  buttonSecondaryGlow: '0 0 20px rgba(234, 179, 8, 0.2)',
  
  buttonDisabledBg: 'rgba(0, 0, 0, 0.05)',
  buttonDisabledText: 'rgba(0, 0, 0, 0.4)',
  buttonDisabledBorder: 'rgba(0, 0, 0, 0.1)',
  
  cardBg: '#ffffff',
  cardBorder: 'rgba(147, 51, 234, 0.2)',
  cardShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  cardBgHover: '#f9f9f9',
  cardBorderHover: 'rgba(147, 51, 234, 0.4)',
  cardShadowHover: '0 4px 12px rgba(147, 51, 234, 0.15)',
  
  inputBg: '#f5f5f5',
  inputBorder: 'rgba(0, 0, 0, 0.1)',
  inputBorderFocus: 'rgba(147, 51, 234, 0.6)',
  inputGlowFocus: '0 0 20px rgba(147, 51, 234, 0.2)',
  inputPlaceholder: 'rgba(0, 0, 0, 0.4)',
  
  badgePurpleBg: 'rgba(147, 51, 234, 0.15)',
  badgePurpleText: '#7e22ce',
  badgePurpleBorder: 'rgba(147, 51, 234, 0.4)',
  
  badgeYellowBg: 'rgba(234, 179, 8, 0.15)',
  badgeYellowText: '#d97706',
  badgeYellowBorder: 'rgba(234, 179, 8, 0.4)',
  
  badgeGreenBg: 'rgba(34, 197, 94, 0.15)',
  badgeGreenText: '#15803d',
  badgeGreenBorder: 'rgba(34, 197, 94, 0.4)',
  
  badgeRedBg: 'rgba(239, 68, 68, 0.15)',
  badgeRedText: '#b91c1c',
  badgeRedBorder: 'rgba(239, 68, 68, 0.4)',
  
  badgeOrangeBg: 'rgba(249, 115, 22, 0.15)',
  badgeOrangeText: '#c2410c',
  badgeOrangeBorder: 'rgba(249, 115, 22, 0.4)',
  
  superAdmin: {
    primary: '#9333ea',
    secondary: '#a855f7',
    background: '#f5f5f5',
    surface: '#ffffff',
    accent: '#f97316',
    text: '#1a1a1a',
    textSecondary: 'rgba(0, 0, 0, 0.7)',
  },
  vendor: {
    primary: '#9333ea',
    secondary: '#a855f7',
    background: '#f5f5f5',
    surface: '#ffffff',
    accent: '#f97316',
    text: '#1a1a1a',
    textSecondary: 'rgba(0, 0, 0, 0.7)',
  },
  driver: {
    primary: '#9333ea',
    secondary: '#a855f7',
    background: '#f5f5f5',
    surface: '#ffffff',
    accent: '#f97316',
    text: '#1a1a1a',
    textSecondary: 'rgba(0, 0, 0, 0.7)',
  }
};

// Global current theme (will be updated by ThemeContext)
let currentTheme = LIGHT_THEME; // DEFAULT TO LIGHT THEME FOR SUPER ADMIN

export const setCurrentTheme = (isDarkMode) => {
  currentTheme = isDarkMode ? DARK_THEME : LIGHT_THEME;
};

export const getCurrentTheme = () => currentTheme;

// Export COLORS as a getter function for dynamic access
export const COLORS = new Proxy({}, {
  get: (target, prop) => {
    return getCurrentTheme()[prop];
  }
});

// API Configuration
const getApiUrl = () => {
  // Use environment variable from .env, fallback to production
  const envUrl = process.env.EXPO_PUBLIC_SMS_API_URL;
  const productionUrl = 'https://kushi-cabs-27p8.onrender.com';  // PRODUCTION
  
  // Priority: env variable > production
  const url = envUrl || productionUrl;
  console.log('🔌 Using SMS API URL:', url);
  return url;
};

export const API_CONFIG = {
  SMS_API_URL: getApiUrl(),
  ADMIN_API_URL: getApiUrl(),
};

// Network retry configuration for reliability
export const NETWORK_CONFIG = {
  RETRY_COUNT: 3,
  RETRY_DELAY_MS: 1000,
  TIMEOUT_MS: 15000,
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
  VENDOR: 0.10,
  DRIVER: 0.15
};

export const TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  COMMISSION: 'commission',
  WITHDRAWAL: 'withdrawal',
  REFUND: 'refund',
};

export const MIN_WALLET_BALANCE = 100;
export const VENDOR_WINDOW_MS = 15 * 60 * 1000;

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
