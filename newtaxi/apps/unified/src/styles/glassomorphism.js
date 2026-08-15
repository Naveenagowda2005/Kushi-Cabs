import { COLORS } from '../constants';

export const glassStyles = {
  // Glass morphism card styles (no padding - let components define it)
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },

  cardActive: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(147, 51, 234, 0.35)',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  // Input field with glass effect (no padding - let components define it)
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    color: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  inputFocused: {
    backgroundColor: 'rgba(147, 51, 234, 0.12)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(147, 51, 234, 0.45)',
    color: '#fff',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },

  // Button styles with animated borders (no padding - let components define it)
  button: {
    backgroundColor: 'rgba(147, 51, 234, 0.85)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9333ea',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  // Banner/Alert styles (no padding - let components define it)
  banner: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  // Icon container (no padding - let components define it)
  iconContainer: {
    backgroundColor: 'rgba(147, 51, 234, 0.12)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.28)',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  // Modal/Overlay
  modal: {
    backgroundColor: 'rgba(15, 10, 30, 0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },

  // Subtle glass effect for backgrounds
  subtleGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Strong glass effect
  strongGlass: {
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.4)',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
};

// Animation configuration for button border transitions
export const buttonBorderAnimation = {
  // Primary button: Purple to Cyan transition
  primary: {
    color1: '#9333ea',      // Purple
    color2: '#00d4ff',      // Cyan
    duration: 2000,         // 2 seconds
  },
  // Secondary button: White to Purple transition
  secondary: {
    color1: 'rgba(255, 255, 255, 0.5)',  // White
    color2: '#9333ea',                    // Purple
    duration: 2000,
  },
  // Accent button: Yellow to Purple transition
  accent: {
    color1: '#eab308',      // Yellow
    color2: '#9333ea',      // Purple
    duration: 2000,
  },
};
