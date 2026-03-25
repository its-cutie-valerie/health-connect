import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'display' | 'headline' | 'title' | 'body' | 'label' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'body',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'display' ? styles.display : undefined,
        type === 'headline' ? styles.headline : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'body' ? styles.body : undefined,
        type === 'label' ? styles.label : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  headline: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0a7ea4',
    textDecorationLine: 'underline',
  },
});
