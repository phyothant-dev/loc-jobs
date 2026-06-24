import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { FontFamily } from '@/constants/theme';
import { useBrand } from '@/contexts/ThemeContext';
import { useLocale } from '@/contexts/LocaleContext';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code' | 'caption' | 'price';
};

function useIsMyanmar(): boolean {
  const { locale } = useLocale();
  return locale === 'my' && Platform.OS === 'ios';
}

function useWeightFont(weight: 'semi' | 'bold' | 'extra'): string | undefined {
  const isMyanmar = useIsMyanmar();
  if (isMyanmar) return 'Myanmar Sangam MN';
  if (weight === 'semi') return FontFamily.semiBold;
  if (weight === 'bold') return FontFamily.bold;
  return FontFamily.extraBold;
}

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  const Brand = useBrand();
  const isMyanmar = useIsMyanmar();
  const baseFont = useWeightFont('semi');
  const boldFont = useWeightFont('bold');
  const extraBoldFont = useWeightFont('extra');

  let fontStyle: Record<string, string> | undefined;
  if (baseFont) {
    if (isMyanmar) {
      const isBoldType = type === 'title' || type === 'subtitle' || type === 'price' || type === 'smallBold';
      fontStyle = { fontFamily: baseFont, fontWeight: isBoldType ? '700' : '400' };
    } else {
      if (type === 'title' || type === 'subtitle' || type === 'price') fontStyle = { fontFamily: extraBoldFont! };
      else if (type === 'smallBold' || type === 'link' || type === 'linkPrimary') fontStyle = { fontFamily: boldFont! };
      else fontStyle = { fontFamily: baseFont };
    }
  }

  const typeColor = type === 'caption' ? { color: Brand.textSecondary }
    : type === 'title' || type === 'subtitle' ? { color: Brand.text }
    : type === 'linkPrimary' ? { color: Brand.primary }
    : type === 'price' ? { color: Brand.primary }
    : null;

  return (
    <Text
      style={[
        { color: Brand.text },
        typeColor,
        fontStyle,
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        type === 'caption' && styles.caption,
        type === 'price' && styles.price,
        isMyanmar && { paddingTop: 3 },
        isMyanmar && type === 'title' && { lineHeight: 44 },
        isMyanmar && type === 'subtitle' && { lineHeight: 32 },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 15,
    lineHeight: 24,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkPrimary: {
    fontSize: 14,
    lineHeight: 20,
  },
  price: {
    fontSize: 16,
    letterSpacing: -0.5,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
})
