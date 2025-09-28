# Translation System Setup

This document explains how to set up and use the translation system in the AGV Protocol app.

## Overview

The translation system supports multiple languages and uses Google Cloud Translation API, DeepL, or OpenAI for automatic translation. It includes caching with Redis for improved performance.

## Supported Languages

- English (en) - Default
- Chinese Simplified (zh-CN)
- Chinese Traditional (zh-TW)
- Korean (ko)
- Tagalog (tl)
- French (fr)
- German (de)
- Spanish (es)
- Arabic (ar)
- Japanese (ja)

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Firebase Configuration (required for Google Cloud Translation)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# Translation Configuration
TRANSLATION_PROVIDER=google  # Options: google, deepl, openai
TRANSLATION_API_KEY=your-api-key  # Required for DeepL and OpenAI

# Redis Configuration (Optional - for caching translations)
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Other environment variables
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy the environment variables above to your `.env.local` file
   - Set up your Firebase project and enable Cloud Translation API
   - Optionally set up Redis for caching

3. **Run Translation Script**
   ```bash
   npm run translate
   ```

## File Structure

```
agv-protocol-app/
├── i18n.ts                    # Locale configuration
├── lib/
│   ├── translator.ts          # Translation service implementations
│   └── translateWithCache.ts  # Caching layer
├── messages/                  # Translation files
│   ├── en.json               # English (source)
│   ├── zh-CN.json            # Chinese Simplified
│   ├── zh-TW.json            # Chinese Traditional
│   └── ...                   # Other languages
└── scripts/
    └── translate-missing.ts  # Translation script
```

## Usage

### Adding New Translations

1. Add new keys to `messages/en.json`
2. Run `npm run translate` to automatically translate missing keys
3. Review and edit translations as needed

### Manual Translation

You can manually edit any translation file in the `messages/` directory.

### Translation Providers

- **Google Cloud Translation**: Default, uses Firebase credentials
- **DeepL**: High-quality translations, requires API key
- **OpenAI**: Uses GPT models, requires API key

## Caching

The system uses Redis for caching translations to improve performance and reduce API costs. If Redis is not configured, translations will still work but won't be cached.

## Scripts

- `npm run translate`: Translates missing keys for all languages
- The script automatically detects missing translations and translates them
- Includes rate limiting to avoid API quota issues

## Notes

- The translation script includes intelligent detection of English placeholders
- Rate limiting is built-in to prevent API quota exhaustion
- Failed translations fall back to the original text
- All translations are cached for 30 days when Redis is available

