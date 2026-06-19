import { Platform } from 'react-native';

export const Brand = {
  primary: '#FF6B35',
  primaryLight: '#FFF4ED',
  primaryDark: '#E55A2B',
  success: '#2ECC71',
  successLight: '#E8F8F0',
  warning: '#F1C40F',
  warningLight: '#FEF9E7',
  danger: '#E74C3C',
  dangerLight: '#FDEDEC',
  white: '#FFFFFF',
  bg: '#FFF8F4',
  card: '#FFFFFF',
  border: '#F5E6DC',
  placeholder: '#C4B5A6',
  text: '#2D2B2A',
  textSecondary: '#9C8E84',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 20,
  five: 32,
  six: 48,
} as const;

export const BorderRadius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const Shadow = {
  card: Platform.select({
    ios: {
      shadowColor: Brand.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  button: Platform.select({
    ios: {
      shadowColor: Brand.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;