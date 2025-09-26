// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, getLocaleFromPathname, addLocaleToPathname } from './lib/i18n';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    // Get locale from Accept-Language header or use default
    const locale = getLocaleFromRequest(request) || defaultLocale;
    
    // Redirect to the pathname with the locale
    const redirectUrl = new URL(addLocaleToPathname(pathname, locale), request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Add locale to response headers for client-side usage
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    const response = NextResponse.next();
    response.headers.set('x-locale', locale);
    return response;
  }

  return NextResponse.next();
}

function getLocaleFromRequest(request: NextRequest): string | null {
  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // Parse Accept-Language header and find the best match
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [locale, qValue] = lang.trim().split(';q=');
        return {
          locale: locale.split('-')[0], // Get language code only
          quality: qValue ? parseFloat(qValue) : 1.0
        };
      })
      .sort((a, b) => b.quality - a.quality);

    // Find the first supported locale
    for (const { locale } of languages) {
      if (locales.includes(locale as any)) {
        return locale;
      }
    }
  }

  return null;
}

export const config = {
  // Matcher ignoring `/_next/`, `/api/`, and static files
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.avif|.*\\.css|.*\\.js|.*\\.woff|.*\\.woff2|.*\\.ttf|.*\\.eot).*)'
  ]
};
