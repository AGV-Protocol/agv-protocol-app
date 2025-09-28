import { ReactNode } from 'react';
import { TranslationProvider } from './TranslationProvider';
import type { Metadata } from 'next';
import { locales, localeNames } from '@/i18n';

const supportedLocales = ['en', 'zh-CN', 'zh-TW', 'ko', 'tl', 'fr', 'de', 'es', 'ar', 'ja'];

async function getMessages(locale: string) {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch {
    return (await import(`@/messages/en.json`)).default;
  }
}

export async function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages(locale);
  
  return {
    title: `${messages?.hero?.title || 'AGV Protocol'} - NFT Minting Platform`,
    description: messages?.hero?.description || 'Building the future of decentralized infrastructure with real-world asset tokenization.',
    openGraph: {
      locale: locale,
      alternateLocale: supportedLocales.filter(l => l !== locale),
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  return (
    <TranslationProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </TranslationProvider>
  );
}
