import { useState, useEffect } from 'react';
import { Locale } from '../../i18n';

interface TranslationMessages {
  [key: string]: any;
}

interface UseTranslationReturn {
  t: (key: string, params?: Record<string, string>) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isLoading: boolean;
}

export function useTranslation(locale: Locale = 'en'): UseTranslationReturn {
  const [messages, setMessages] = useState<TranslationMessages>({});
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMessages(currentLocale);
  }, [currentLocale]);

  const loadMessages = async (targetLocale: Locale) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/messages/${targetLocale}.json`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        // Fallback to English if locale not found
        if (targetLocale !== 'en') {
          const fallbackResponse = await fetch('/messages/en.json');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setMessages(fallbackData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to empty object
      setMessages({});
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    if (typeof value === 'string') {
      // Replace parameters if provided
      if (params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey] || match;
        });
      }
      return value;
    }
    
    return key; // Return key if value is not a string
  };

  const setLocale = (newLocale: Locale) => {
    setCurrentLocale(newLocale);
  };

  return {
    t,
    locale: currentLocale,
    setLocale,
    isLoading
  };
}

