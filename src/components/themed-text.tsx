import { StyleSheet, Text, type TextProps } from 'react-native';
import { Brand, FontFamily } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code' | 'caption' | 'price';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  return (
    <Text
      style={[
        { color: Brand.text, fontFamily: FontFamily.semiBold },
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
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FontFamily.semiBold,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.2,
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.3,
    color: Brand.textSecondary,
  },
  title: {
    fontSize: 30,
    fontFamily: FontFamily.extraBold,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: Brand.text,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: FontFamily.extraBold,
    lineHeight: 26,
    letterSpacing: -0.5,
    color: Brand.text,
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.bold,
  },
  linkPrimary: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.bold,
    color: Brand.primary,
  },
  price: {
    fontSize: 16,
    fontFamily: FontFamily.extraBold,
    color: Brand.primary,
    letterSpacing: -0.5,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
})
