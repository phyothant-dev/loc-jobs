import { Brand } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return {
    text: Brand.text,
    background: Brand.bg,
    backgroundElement: Brand.card,
    backgroundSelected: Brand.primaryLight,
    textSecondary: Brand.textSecondary,
  };
}