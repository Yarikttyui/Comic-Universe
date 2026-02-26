export const colors = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#6C5CE7',
    600: '#5B4BD5',
    700: '#4A3AC3',
    800: '#3929B1',
    900: '#28189F',
  },
  
  secondary: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FD79A8',
    600: '#FB6894',
    700: '#F95780',
    800: '#F7466C',
    900: '#F53558',
  },
  
  accent: {
    teal: '#00CEC9',
    orange: '#E17055',
    yellow: '#FDCB6E',
    green: '#00B894',
    blue: '#0984E3',
    purple: '#A29BFE',
  },
  
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },
  
  background: {
    primary: '#0D0D1A',
    secondary: '#1A1A2E',
    tertiary: '#16213E',
    card: '#252540',
    elevated: '#2D2D4A',
  },
  
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0C0',
    tertiary: '#6E6E80',
    inverse: '#0D0D1A',
    link: '#6C5CE7',
  },
  
  status: {
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#E17055',
    info: '#0984E3',
  },
  
  gradients: {
    primary: ['#6C5CE7', '#A29BFE'],
    secondary: ['#FD79A8', '#FDCB6E'],
    dark: ['#0D0D1A', '#1A1A2E'],
    card: ['#252540', '#1A1A2E'],
  },
} as const;

export const typography = {
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    secondary: '"Poppins", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    comic: '"Comic Neue", "Comic Sans MS", cursive',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 64,
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.15)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.25)',
  glow: '0 0 20px rgba(108, 92, 231, 0.4)',
  glowStrong: '0 0 40px rgba(108, 92, 231, 0.6)',
} as const;

export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
} as const;

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
} as const;

export type Theme = typeof theme;
