import { Platform } from 'react-native';

const primaryBlue = '#2196F3';
const secondaryBlue = '#1976D2';
const primaryDark = '#0F172A'; // Deep slate
const cardDark = '#1E293B'; // Slightly lighter slate
const borderDark = '#334155';

export const Colors = {
  light: {
    text: '#0F172A',
    subtext: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    primary: primaryBlue,
    secondary: secondaryBlue,
    success: '#10B981',
    error: '#EF4444',
    tint: primaryBlue,
    icon: '#64748B',
    tabIconDefault: '#64748B',
    tabIconSelected: primaryBlue,
  },
  dark: {
    text: '#F8FAFC',
    subtext: '#94A3B8',
    background: primaryDark,
    card: cardDark,
    border: borderDark,
    primary: primaryBlue,
    secondary: '#60A5FA',
    success: '#34D399',
    error: '#F87171',
    tint: '#FFFFFF',
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#FFFFFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
