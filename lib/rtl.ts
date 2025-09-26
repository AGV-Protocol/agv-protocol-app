// lib/rtl.ts
import { Locale, isRTL } from './i18n';

// RTL utility functions
export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

// Tailwind RTL class utilities
export function getRTLClasses(locale: Locale, ltrClass: string, rtlClass: string): string {
  return isRTL(locale) ? rtlClass : ltrClass;
}

// Common RTL spacing utilities
export function getRTLSpacing(locale: Locale, property: 'margin' | 'padding', side: 'left' | 'right', value: string): string {
  const direction = isRTL(locale) ? (side === 'left' ? 'right' : 'left') : side;
  return `${property}-${direction}: ${value}`;
}

// RTL-aware flex utilities
export function getRTLFlex(locale: Locale): string {
  return isRTL(locale) ? 'flex-row-reverse' : 'flex-row';
}

// RTL-aware text alignment
export function getRTLTextAlign(locale: Locale, align: 'left' | 'right'): string {
  if (align === 'left') {
    return isRTL(locale) ? 'text-right' : 'text-left';
  } else {
    return isRTL(locale) ? 'text-left' : 'text-right';
  }
}

// RTL-aware border utilities
export function getRTLBorder(locale: Locale, side: 'left' | 'right', value: string): string {
  const direction = isRTL(locale) ? (side === 'left' ? 'right' : 'left') : side;
  return `border-${direction}: ${value}`;
}
