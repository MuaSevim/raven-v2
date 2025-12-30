// Raven Design System - Based on Uber's Base Design System
// Typography: Inter font, 8px grid spacing

export const colors = {
  // Primary
  primary: '#000000',
  primaryText: '#000000',
  
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F6F6F6',
  backgroundTertiary: '#F0F2F5',
  
  // Borders
  border: '#E2E2E2',
  borderFocused: '#000000',
  
  // Accent
  accent: '#276EF1',
  accentLight: '#EBF2FE',
  
  // Feedback
  success: '#05944F',
  successLight: '#E6F4ED',
  warning: '#FFC043',
  warningLight: '#FEF3E4',
  error: '#E11900',
  errorLight: '#FFEFED',
  
  // Text
  textPrimary: '#000000',
  textSecondary: '#545454',
  textTertiary: '#757575',
  textDisabled: '#AFAFAF',
  textInverse: '#FFFFFF',
  placeholder: '#9E9E9E', // 12% more subtle than textTertiary
  
  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const typography = {
  // Font Family
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  
  // Line Heights (1.5 multiplier for body)
  lineHeight: {
    xs: 18,
    sm: 21,
    base: 24,
    lg: 27,
    xl: 30,
    '2xl': 36,
    '3xl': 48,
  },
};

// 8px Grid System
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 56,
  '5xl': 64,
};

export const borderRadius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  full: 9999,
};

// Component-specific dimensions
export const dimensions = {
  inputHeight: 56,
  buttonHeight: 56,
  iconSize: 24,
  iconSizeSm: 20,
  iconSizeLg: 32,
  headerHeight: 56,
  progressDotSize: 8,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  dimensions,
  shadows,
};
