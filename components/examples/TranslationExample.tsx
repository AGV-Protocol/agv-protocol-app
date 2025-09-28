'use client';

import React from 'react';
import { useTranslation } from '../../lib/providers/TranslationProvider';
import { LanguageSelector } from '../ui/language-selector';

export function TranslationExample() {
  const { t, isLoading } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('hero.title')}</h1>
        <LanguageSelector />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">{t('hero.subtitle')}</h2>
        <p className="text-gray-600 mb-6">{t('hero.description')}</p>
        
        <div className="flex space-x-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            {t('hero.buttons.getStarted')}
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50">
            {t('hero.buttons.learnMore')}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">{t('staking.title')}</h3>
          <p className="text-gray-600 mb-4">{t('staking.description')}</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{t('staking.totalStaked')}:</span>
              <span className="font-medium">1,234 AGV</span>
            </div>
            <div className="flex justify-between">
              <span>{t('staking.availableRewards')}:</span>
              <span className="font-medium">56.78 AGV</span>
            </div>
          </div>
          <button className="w-full mt-4 bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
            {t('staking.stake')}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">{t('minting.title')}</h3>
          <p className="text-gray-600 mb-4">{t('minting.description')}</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{t('minting.price')}:</span>
              <span className="font-medium">0.1 ETH</span>
            </div>
            <div className="flex justify-between">
              <span>{t('minting.remaining')}:</span>
              <span className="font-medium">456/1000</span>
            </div>
          </div>
          <button className="w-full mt-4 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700">
            {t('minting.mint')}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">{t('common.required')} Environment Variables</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• FIREBASE_PROJECT_ID</p>
          <p>• FIREBASE_CLIENT_EMAIL</p>
          <p>• FIREBASE_PRIVATE_KEY</p>
          <p>• TRANSLATION_PROVIDER (optional, defaults to 'google')</p>
          <p>• UPSTASH_REDIS_REST_URL (optional, for caching)</p>
          <p>• UPSTASH_REDIS_REST_TOKEN (optional, for caching)</p>
        </div>
      </div>
    </div>
  );
}

