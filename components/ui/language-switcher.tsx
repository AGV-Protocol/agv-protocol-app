// components/ui/language-switcher.tsx
'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, localeFlags, isRTL } from '@/lib/i18n';
import { addLocaleToPathname, removeLocaleFromPathname } from '@/lib/i18n';
import { Locale } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  showFlags?: boolean;
  showNames?: boolean;
}

export function LanguageSwitcher({ 
  className = '', 
  showFlags = true, 
  showNames = true 
}: LanguageSwitcherProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const currentLocale = (params?.locale as Locale) || 'en';
  const isCurrentRTL = isRTL(currentLocale);

  const handleLocaleChange = (newLocale: Locale) => {
    const currentPath = removeLocaleFromPathname(pathname);
    const newPath = addLocaleToPathname(currentPath, newLocale);
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${className}`}
          dir={isCurrentRTL ? 'rtl' : 'ltr'}
        >
          <Globe className="h-4 w-4" />
          {showFlags && <span>{localeFlags[currentLocale]}</span>}
          {showNames && <span className="hidden sm:inline">{localeNames[currentLocale]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={`flex items-center gap-2 cursor-pointer ${
              locale === currentLocale ? 'bg-accent' : ''
            }`}
            dir={isRTL(locale) ? 'rtl' : 'ltr'}
          >
            {showFlags && <span className="text-lg">{localeFlags[locale]}</span>}
            {showNames && <span>{localeNames[locale]}</span>}
            {locale === currentLocale && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile or smaller spaces
export function CompactLanguageSwitcher({ className = '' }: { className?: string }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const currentLocale = (params?.locale as Locale) || 'en';

  const handleLocaleChange = (newLocale: Locale) => {
    const currentPath = removeLocaleFromPathname(pathname);
    const newPath = addLocaleToPathname(currentPath, newLocale);
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`p-2 ${className}`}
        >
          <span className="text-lg">{localeFlags[currentLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={`flex items-center gap-2 cursor-pointer ${
              locale === currentLocale ? 'bg-accent' : ''
            }`}
          >
            <span className="text-lg">{localeFlags[locale]}</span>
            <span className="text-sm">{localeNames[locale]}</span>
            {locale === currentLocale && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
