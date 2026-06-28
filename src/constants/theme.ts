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
  border: '#F0E4DA',
  borderLight: '#F8F0EA',
  placeholder: '#C4B5A6',
  text: '#2D2B2A',
  textSecondary: '#A09388',
  textTertiary: '#C4B5A6',
  overlay: 'rgba(0,0,0,0.35)',
};

export const DarkBrand = {
  white: '#252540',
  bg: '#12121C',
  card: '#1E1E32',
  primaryLight: '#1A1A2E',
  primaryDark: '#CC4E1F',
  successLight: '#1A2E1A',
  warningLight: '#2E2A1A',
  border: '#2D2D44',
  borderLight: '#26263A',
  placeholder: '#5A5A72',
  text: '#EAEAEA',
  textSecondary: '#9A9AB0',
  textTertiary: '#5A5A72',
  overlay: 'rgba(0,0,0,0.6)',
  dangerLight: '#3A1A1A',
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 26,
  xxl: 34,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
} as const;

export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
