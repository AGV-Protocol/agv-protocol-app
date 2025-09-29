"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function TestTranslationsPage() {
  const { t, locale } = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Translation System Test
            </h1>
            <LanguageSwitcher currentLocale={locale} />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  Common Translations
                </h2>
                <div className="space-y-2">
                  <p><strong>Loading:</strong> {t('common.loading')}</p>
                  <p><strong>Error:</strong> {t('common.error')}</p>
                  <p><strong>Success:</strong> {t('common.success')}</p>
                  <p><strong>Cancel:</strong> {t('common.cancel')}</p>
                  <p><strong>Confirm:</strong> {t('common.confirm')}</p>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-green-900 mb-4">
                  Navigation Translations
                </h2>
                <div className="space-y-2">
                  <p><strong>Home:</strong> {t('nav.home')}</p>
                  <p><strong>About:</strong> {t('nav.about')}</p>
                  <p><strong>Career:</strong> {t('nav.career')}</p>
                  <p><strong>Blog:</strong> {t('nav.blog')}</p>
                  <p><strong>Dashboard:</strong> {t('nav.dashboard')}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">
                Minting Translations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Title:</strong> {t('minting.title')}</p>
                  <p><strong>Description:</strong> {t('minting.description')}</p>
                  <p><strong>Collections:</strong> {t('minting.collections')}</p>
                </div>
                <div>
                  <p><strong>Live Minting:</strong> {t('minting.liveMinting')}</p>
                  <p><strong>Multi-Chain:</strong> {t('minting.multiChain')}</p>
                  <p><strong>USDT Payment:</strong> {t('minting.usdtPayment')}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">
                Current Locale Information
              </h2>
              <div className="space-y-2">
                <p><strong>Current Locale:</strong> {locale}</p>
                <p><strong>Available Locales:</strong> en, zh-CN, zh-TW, ko, tl, fr, de, es, ar, ja</p>
                <p><strong>Translation System:</strong> ✅ Working</p>
                <p><strong>Language Switcher:</strong> ✅ Available</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Test Instructions
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Use the language switcher in the top-right corner to change languages</li>
                <li>Verify that all text above changes to the selected language</li>
                <li>Check that the URL updates with the new locale (e.g., /en/test-translations → /zh-CN/test-translations)</li>
                <li>Refresh the page and verify the language persists</li>
                <li>Test all 10 supported languages: English, 简体中文, 繁體中文, 한국어, Tagalog, Français, Deutsch, Español, العربية, 日本語</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}