import { Platform } from 'react-native';
import { getMaterial3Theme } from '@pchmn/expo-material3-theme';

const { light: m3Light, dark: m3Dark } = getMaterial3Theme('#6750A4');

/**
 * Basic luminance calculation to determine if a color is light or dark.
 */
function getContrastColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#1C1B1F' : '#FFFFFF';
}

const lightPrimary = m3Light.primary;
const lightSuccess = '#386A20';
const darkPrimary = m3Dark.primary;
const darkSuccess = '#B2F08D';

export const Colors = {
  light: {
    text: m3Light.onSurface,
    subtext: m3Light.onSurfaceVariant,
    background: m3Light.background,
    surface: m3Light.surface,
    card: m3Light.surfaceVariant,
    border: m3Light.outline,
    primary: lightPrimary,
    onPrimary: getContrastColor(lightPrimary),
    primaryContainer: m3Light.primaryContainer,
    onPrimaryContainer: m3Light.onPrimaryContainer,
    secondary: m3Light.secondary,
    success: lightSuccess,
    onSuccess: getContrastColor(lightSuccess),
    error: m3Light.error,
    onError: m3Light.onError,
    tint: m3Light.primary,
    icon: m3Light.onSurfaceVariant,
    tabIconDefault: m3Light.onSurfaceVariant,
    tabIconSelected: m3Light.primary,
  },
  dark: {
    text: m3Dark.onSurface,
    subtext: m3Dark.onSurfaceVariant,
    background: m3Dark.background,
    surface: m3Dark.surface,
    card: m3Dark.surfaceVariant,
    border: m3Dark.outline,
    primary: darkPrimary,
    onPrimary: getContrastColor(darkPrimary),
    primaryContainer: m3Dark.primaryContainer,
    onPrimaryContainer: m3Dark.onPrimaryContainer,
    secondary: m3Dark.secondary,
    success: darkSuccess,
    onSuccess: getContrastColor(darkSuccess),
    error: m3Dark.error,
    onError: m3Dark.onError,
    tint: m3Dark.primary,
    icon: m3Dark.onSurfaceVariant,
    tabIconDefault: m3Dark.onSurfaceVariant,
    tabIconSelected: m3Dark.primary,
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
