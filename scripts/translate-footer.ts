import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createTranslator } from '../lib/translator';
import { translateObject } from '../lib/translateWithCache';
import { locales, defaultLocale } from '../i18n';
import { config } from 'dotenv';

config();

// Only translate the footer section
const FOOTER_KEYS = [
  'footer.companyName',
  'footer.tagline', 
  'footer.description',
  'footer.features.secure',
  'footer.features.fast',
  'footer.features.multiChain',
  'footer.navigation.product.title',
  'footer.navigation.product.nftMinting',
  'footer.navigation.product.dashboard',
  'footer.navigation.product.kolProgram',
  'footer.navigation.product.analytics',
  'footer.navigation.company.title',
  'footer.navigation.company.aboutUs',
  'footer.navigation.company.careers',
  'footer.navigation.company.press',
  'footer.navigation.company.blog',
  'footer.navigation.support.title',
  'footer.navigation.support.helpCenter',
  'footer.navigation.support.documentation',
  'footer.navigation.support.apiReference',
  'footer.navigation.support.contactSupport',
  'footer.navigation.legal.title',
  'footer.navigation.legal.privacyPolicy',
  'footer.navigation.legal.termsOfService',
  'footer.navigation.legal.cookiePolicy',
  'footer.navigation.legal.gdpr',
  'footer.legal.headquarters',
  'footer.legal.description',
  'footer.copyright'
];

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

function findMissingFooterKeys(sourceMessages: any, targetMessages: any): string[] {
  const missingKeys: string[] = [];
  
  for (const key of FOOTER_KEYS) {
    const sourceValue = getNestedValue(sourceMessages, key);
    const targetValue = getNestedValue(targetMessages, key);
    
    if (sourceValue && !targetValue) {
      missingKeys.push(key);
    }
  }
  
  return missingKeys;
}

async function translateFooterKeys() {
  console.log('?? Translating footer content for all languages...\n');
  
  try {
    const translator = createTranslator();
    console.log(`Using translator: ${translator.constructor.name}\n`);
    
    // Load source messages (English)
    const sourcePath = join(process.cwd(), 'messages', `${defaultLocale}.json`);
    const sourceMessages = JSON.parse(readFileSync(sourcePath, 'utf-8'));
    
    for (const locale of locales) {
      if (locale === defaultLocale) continue;
      
      console.log(`?? Processing ${locale}...`);
      
      const targetPath = join(process.cwd(), 'messages', `${locale}.json`);
      const targetMessages = existsSync(targetPath) 
        ? JSON.parse(readFileSync(targetPath, 'utf-8'))
        : {};
      
      const missingKeys = findMissingFooterKeys(sourceMessages, targetMessages);
      
      if (missingKeys.length === 0) {
        console.log(`? ${locale}: All footer keys already translated\n`);
        continue;
      }
      
      console.log(`?? Found ${missingKeys.length} missing footer keys in ${locale}`);
      
      // Create a minimal object with only the missing footer keys
      const missingFooterData: any = {};
      for (const key of missingKeys) {
        const sourceValue = getNestedValue(sourceMessages, key);
        if (sourceValue) {
          setNestedValue(missingFooterData, key, sourceValue);
        }
      }
      
      if (Object.keys(missingFooterData).length === 0) {
        console.log(`??  ${locale}: No footer data to translate\n`);
        continue;
      }
      
      try {
        console.log(`?? Translating footer content for ${locale}...`);
        const translatedFooter = await translateObject(translator, {
          obj: missingFooterData,
          from: 'en',
          to: locale
        });
        
        // Merge translated footer data into target messages
        for (const key of missingKeys) {
          const translatedValue = getNestedValue(translatedFooter, key);
          if (translatedValue) {
            setNestedValue(targetMessages, key, translatedValue);
          }
        }
        
        // Write updated messages
        writeFileSync(targetPath, JSON.stringify(targetMessages, null, 2));
        console.log(`? ${locale}: Footer translation completed\n`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`? Error translating footer for ${locale}:`, error);
      }
    }
    
    console.log('?? Footer translation completed for all languages!');
    
  } catch (error) {
    console.error('? Error in footer translation process:', error);
  }
}

// Run the script
translateFooterKeys();
