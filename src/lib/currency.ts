export const CURRENCIES = [
  'MMK',
  'USD',
  'EUR',
  'GBP',
  'SGD',
  'THB',
  'JPY',
  'KRW',
  'CNY',
  'INR',
] as const

export const CURRENCY_SYMBOLS: Record<string, string> = {
  MMK: 'Ks',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  THB: '฿',
  JPY: '¥',
  KRW: '₩',
  CNY: '¥',
  INR: '₹',
}

export function currencyLabel(code: string): string {
  const symbol = CURRENCY_SYMBOLS[code]
  return symbol && symbol !== code ? `${code} (${symbol})` : code
}

export function formatPrice(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return ''
  const code = currency || 'MMK'
  const symbol = CURRENCY_SYMBOLS[code] || code
  return `${amount.toLocaleString()} ${symbol}`
}
