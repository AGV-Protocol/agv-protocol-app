"use client";
import { useTranslations } from "@/hooks/useTranslations";

export default function TestTranslationsPage() {
  const { t, locale } = useTranslations();

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Translation Test - Current Locale: {locale}</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Hero Section</h2>
            <p><strong>Description:</strong> {t('hero.description')}</p>
            <p><strong>Start Minting:</strong> {t('hero.startMinting')}</p>
            <p><strong>View Staking:</strong> {t('hero.viewStaking')}</p>
            <p><strong>Blockchains:</strong> {t('hero.blockchains')}</p>
            <p><strong>NFT Collections:</strong> {t('hero.nftCollections')}</p>
            <p><strong>Daily Rewards:</strong> {t('hero.dailyRewards')}</p>
            <p><strong>Security Score:</strong> {t('hero.securityScore')}</p>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Navigation</h2>
            <p><strong>Home:</strong> {t('nav.home')}</p>
            <p><strong>Blog:</strong> {t('nav.blog')}</p>
            <p><strong>Career:</strong> {t('nav.career')}</p>
            <p><strong>Staking:</strong> {t('nav.staking')}</p>
            <p><strong>Mint:</strong> {t('nav.mint')}</p>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Blog</h2>
            <p><strong>Title:</strong> {t('blog.title')}</p>
            <p><strong>Subtitle:</strong> {t('blog.subtitle')}</p>
            <p><strong>Search Placeholder:</strong> {t('blog.searchPlaceholder')}</p>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Common</h2>
            <p><strong>Loading:</strong> {t('common.loading')}</p>
            <p><strong>Error:</strong> {t('common.error')}</p>
            <p><strong>Success:</strong> {t('common.success')}</p>
            <p><strong>Cancel:</strong> {t('common.cancel')}</p>
            <p><strong>Confirm:</strong> {t('common.confirm')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
