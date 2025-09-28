"use client";

import React from "react";
import { useTranslations } from '../TranslationProvider';
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestTranslationPage() {
  const t = useTranslations();
  const tHero = useTranslations('hero');
  const tStaking = useTranslations('staking');
  const tMinting = useTranslations('minting');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Translation Test Page</h1>
          <LanguageSwitcher />
        </div>

        <div className="grid gap-6">
          {/* Hero Section Test */}
          <Card>
            <CardHeader>
              <CardTitle>{t('hero.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">{t('hero.subtitle')}</p>
              <p className="text-gray-600">{t('hero.description')}</p>
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded">
                  {t('hero.buttons.getStarted')}
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded">
                  {t('hero.buttons.learnMore')}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Staking Section Test */}
          <Card>
            <CardHeader>
              <CardTitle>{tStaking('title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{tStaking('description')}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">{tStaking('totalStaked')}:</span>
                  <span className="ml-2">1,234 AGV</span>
                </div>
                <div>
                  <span className="font-medium">{tStaking('availableRewards')}:</span>
                  <span className="ml-2">56.78 AGV</span>
                </div>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded">
                {tStaking('stake')}
              </button>
            </CardContent>
          </Card>

          {/* Minting Section Test */}
          <Card>
            <CardHeader>
              <CardTitle>{tMinting('title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{tMinting('description')}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">{tMinting('price')}:</span>
                  <span className="ml-2">0.1 ETH</span>
                </div>
                <div>
                  <span className="font-medium">{tMinting('remaining')}:</span>
                  <span className="ml-2">456/1000</span>
                </div>
              </div>
              <button className="px-4 py-2 bg-purple-600 text-white rounded">
                {tMinting('mint')}
              </button>
            </CardContent>
          </Card>

          {/* Navigation Test */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation Translation Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>{t('navigation.home')}</div>
                <div>{t('navigation.dashboard')}</div>
                <div>{t('navigation.staking')}</div>
                <div>{t('navigation.mint')}</div>
                <div>{t('navigation.about')}</div>
                <div>{t('navigation.contact')}</div>
              </div>
            </CardContent>
          </Card>

          {/* Common Elements Test */}
          <Card>
            <CardHeader>
              <CardTitle>Common Elements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm">
                  {t('common.loading')}
                </button>
                <button className="px-3 py-1 bg-red-600 text-white rounded text-sm">
                  {t('common.error')}
                </button>
                <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                  {t('common.success')}
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                  {t('common.submit')}
                </button>
                <button className="px-3 py-1 bg-gray-400 text-white rounded text-sm">
                  {t('common.cancel')}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Translation System Status</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ 10 languages supported</li>
            <li>✅ Dynamic locale routing</li>
            <li>✅ Translation context provider</li>
            <li>✅ Language switcher component</li>
            <li>✅ API translation endpoint</li>
            <li>✅ Automated translation script</li>
            <li>✅ Redis caching support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
