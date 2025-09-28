'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, locales, defaultLocale } from '../../i18n';

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function TranslationProvider({ children, initialLocale = defaultLocale }: TranslationProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMessages(locale);
  }, [locale]);

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

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('agv-locale', newLocale);
    }
  };

  // Load saved locale on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('agv-locale') as Locale;
      if (savedLocale && locales.includes(savedLocale)) {
        setLocale(savedLocale);
      }
    }
  }, []);

  return (
    <TranslationContext.Provider value={{
      locale,
      setLocale: handleSetLocale,
      t,
      isLoading
    }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

