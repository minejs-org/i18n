<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="60" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.2-black"/>
    <img src="https://img.shields.io/badge/🔥-@minejs-black"/>
    <img src="https://img.shields.io/badge/zero-dependencies-black" alt="Test Coverage" />
    <br>
    <img src="https://img.shields.io/badge/coverage-95.19%25-brightgreen" alt="Test Coverage" />
    <img src="https://img.shields.io/github/issues/minejs-org/i18n?style=flat" alt="Github Repo Issues" />
    <img src="https://img.shields.io/github/stars/minejs-org/i18n?style=social" alt="GitHub Repo stars" />
</div>
<br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    > **_A lightweight, production-ready internationalization (i18n) library with zero dependencies._**

    - ### Setup

        > install [`space`](https://github.com/solution-lib/space) first.

        ```bash
        space i @minejs/i18n
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Usage

        ```ts
        import { I18nManager, setupI18n, t, setLanguage } from '@minejs/i18n'
        ```

        - ### 1. Basic Translation

            ```typescript
            import { I18nManager } from '@minejs/i18n'

            // Create a manager instance
            const i18n = new I18nManager()

            // Load translations
            i18n.loadLanguage('en', {
                greeting: 'Hello',
                welcome: 'Welcome to our app'
            })

            i18n.loadLanguage('ar', {
                greeting: 'مرحبا',
                welcome: 'مرحبا بك في تطبيقنا'
            })

            // Translate
            console.log(i18n.t('greeting')) // "Hello"

            // Switch language
            await i18n.setLanguage('ar')
            console.log(i18n.t('greeting')) // "مرحبا"
            ```

        - ### 2. Parameter Replacement

            ```typescript
            const i18n = new I18nManager()

            i18n.loadLanguage('en', {
                message: 'Hello {name}, you have {count} messages',
                userName: 'John'
            })

            // Replace parameters
            const result = i18n.t('message', {
                name: 'John',
                count: '5'
            })
            // "Hello John, you have 5 messages"

            // Parameters can reference other translation keys
            const greeting = i18n.t('message', {
                name: 'userName',  // References i18n.t('userName')
                count: '3'
            })
            ```

        - ### 3. Nested Translations

            ```typescript
            const i18n = new I18nManager()

            // Deeply nested structures are flattened automatically
            i18n.loadLanguage('en', {
                app: {
                    title: 'My App',
                    pages: {
                        home: {
                            title: 'Home',
                            description: 'Welcome to home page'
                        },
                        about: {
                            title: 'About Us'
                        }
                    }
                }
            })

            console.log(i18n.t('app.title')) // "My App"
            console.log(i18n.t('app.pages.home.title')) // "Home"
            console.log(i18n.t('app.pages.home.description')) // "Welcome to home page"
            ```

        - ### 4. Parse HTML Tags

            ```typescript
            const i18n = new I18nManager()

            i18n.loadLanguage('en', {
                message: 'Hello <strong>World</strong>'
            })

            // Parse HTML tags into tokens
            const tokens = i18n.tParse('message')
            // [
            //   { type: 'text', content: 'Hello ' },
            //   { type: 'tag', tag: 'strong', content: 'World' }
            // ]

            // Convert newlines to <br> tags
            i18n.loadLanguage('en', {
                multiline: 'Line 1\\nLine 2\\nLine 3'
            })

            const lines = i18n.tParse('multiline')
            // Includes <br> tags for newlines
            ```

        - ### 5. RTL Language Support

            ```typescript
            const i18n = new I18nManager()

            i18n.loadLanguage('en', { title: 'My App' })
            i18n.loadLanguage('ar', { title: 'تطبيقي' })

            // Check if current language is RTL
            await i18n.setLanguage('ar')
            console.log(i18n.isRTL()) // true

            // Check specific language
            console.log(i18n.isRTLLanguage('ar')) // true
            console.log(i18n.isRTLLanguage('en')) // false

            // Supported RTL languages: ar, he, fa, ur, yi, ji, iw, ku
            ```

        - ### 6. Language Change Events

            ```typescript
            const i18n = new I18nManager()

            i18n.loadLanguage('en', { greeting: 'Hello' })
            i18n.loadLanguage('ar', { greeting: 'مرحبا' })

            // Subscribe to language changes
            const unsubscribe = i18n.onChange((lang) => {
                console.log('Language changed to:', lang)
            })

            await i18n.setLanguage('ar')
            // Logs: "Language changed to: ar"

            // Unsubscribe
            unsubscribe()
            ```

        - ### 7. Storage Integration

            ```typescript
            import { memoryStorage, browserStorage } from '@minejs/i18n'

            // Use browser localStorage (automatically persists language preference)
            const i18n = new I18nManager({
                defaultLanguage: 'en',
                supportedLanguages: ['en', 'ar', 'fr'],
                storage: browserStorage  // Or memoryStorage for server
            })

            // Language preference is saved and restored automatically
            await i18n.setLanguage('ar')
            await i18n.init() // Restores 'ar' from storage
            ```

        - ### 8. Global Instance

            ```typescript
            import {
                t, tLang, setLanguage, getLanguage,
                isRTL, hasKey, onChange, loadLanguage,
                loadTranslations
            } from '@minejs/i18n'

            // Use global instance with convenience functions
            loadLanguage('en', {
                greeting: 'Hello',
                farewell: 'Goodbye'
            })

            console.log(t('greeting')) // "Hello"
            console.log(hasKey('greeting')) // true
            console.log(getLanguage()) // "en"

            // Translate with specific language
            loadLanguage('ar', { greeting: 'مرحبا' })
            console.log(tLang('greeting', 'ar')) // "مرحبا"

            // Listen for changes
            onChange((lang) => {
                console.log('Switched to:', lang)
            })

            await setLanguage('ar')
            ```

        - ### 9. Lazy Loading

            ```typescript
            import { setupLazy } from '@minejs/i18n'

            // Only load default language at startup
            const loader = await setupLazy({
                defaultLanguage: 'en',
                supportedLanguages: ['en', 'ar', 'fr', 'de', 'zh'],
                basePath: 'https://cdn.example.com/i18n/'
            })

            // Later, when user switches language
            await loader.load('ar')
            await setLanguage('ar')

            // Check if language is already loaded
            if (!loader.isLoaded('fr')) {
                await loader.load('fr')
            }
            ```

        - ### 10. Auto-Setup: Environment-Aware Loading

            > Automatically detects browser vs server environment and loads translations from files or URLs

            ```typescript
            import { setupAuto } from '@minejs/i18n'

            // Browser: Fetches from http://localhost:3000/static/i18n/en.json
            // Server: Reads from ./static/i18n/en.json
            const loader = await setupAuto({
                defaultLanguage: 'en',
                supportedLanguages: ['en', 'ar', 'fr', 'de'],
                basePath: 'http://localhost:3000/static/i18n/',
                // For server-side, use:
                // basePath: './static/i18n/',
                fileExtension: 'json' // Optional, defaults to 'json'
            })

            // Load other languages on-demand
            await loader.load('ar')
            await setLanguage('ar')

            // File structure example:
            // Browser: /public/static/i18n/en.json
            // Server: ./static/i18n/en.json
            ```

            **Translation file format** (`en.json`):
            ```json
            {
                "greeting": "Hello",
                "welcome": "Welcome to our app",
                "app": {
                    "name": "MyApp",
                    "title": "Welcome"
                }
            }
            ```

        - ### 11. Utility Functions

            ```typescript
            import { genPageTitle, plural } from '@minejs/i18n'

            // Generate page title with app name
            const title = genPageTitle('home', 'page.')
            // LTR: "Home - MyApp"
            // RTL: "MyApp - الرئيسية"

            // Pluralization
            const itemCount = plural(1, 'item.single', 'item.plural')
            // 1 → "1 item"
            // 5 → "5 items"
            ```


    <br>

- ## API Reference 🔥

    - ### I18nManager Class

        - #### `constructor(config?: I18nConfig)`
            > Create a new I18n manager instance.

            ```typescript
            const i18n = new I18nManager({
                defaultLanguage: 'en',
                fallbackLanguage: 'en',
                supportedLanguages: ['en', 'ar', 'fr'],
                storage: browserStorage,
                onLanguageChange: (lang) => console.log('Changed to:', lang)
            })
            ```

        - #### `init(): Promise<void>`
            > Initialize manager and restore language from storage.

            ```typescript
            const i18n = new I18nManager({ storage: browserStorage })
            await i18n.init() // Restores saved language
            ```

        - #### `loadLanguage(lang: LanguageCode, translations: object): void`
            > Load translations for a specific language. Nested objects are flattened.

            ```typescript
            i18n.loadLanguage('en', {
                app: { name: 'MyApp' },
                greeting: 'Hello'
            })

            i18n.t('app.name')  // "MyApp"
            i18n.t('greeting')  // "Hello"
            ```

        - #### `loadTranslations(translations: TranslationSet): void`
            > Load multiple languages at once.

            ```typescript
            i18n.loadTranslations({
                en: { greeting: 'Hello' },
                ar: { greeting: 'مرحبا' },
                fr: { greeting: 'Bonjour' }
            })
            ```

        - #### `t(key: string, params?: object): string`
            > Translate a key with optional parameter replacement.

            ```typescript
            i18n.loadLanguage('en', {
                greeting: 'Hello {name}'
            })

            i18n.t('greeting', { name: 'John' }) // "Hello John"
            i18n.t('missing.key') // "missing.key" (returns key if not found)
            ```

        - #### `tLang(key: string, lang: LanguageCode, params?: object): string`
            > Translate a key with a specific language temporarily.

            ```typescript
            i18n.loadLanguage('ar', { greeting: 'مرحبا' })

            const result = i18n.tLang('greeting', 'ar')
            // Returns Arabic translation without changing current language
            ```

        - #### `tParse(key: string, params?: object): TranslationToken[]`
            > Parse translation with HTML tags into tokens. Converts \n and /n to <br> tags.

            ```typescript
            i18n.loadLanguage('en', {
                message: 'Hello <strong>World</strong>\\nLine 2'
            })

            const tokens = i18n.tParse('message')
            // [
            //   { type: 'text', content: 'Hello ' },
            //   { type: 'tag', tag: 'strong', content: 'World' },
            //   { type: 'tag', tag: 'br', content: '' },
            //   { type: 'text', content: 'Line 2' }
            // ]
            ```

        - #### `setLanguage(lang: LanguageCode): Promise<void>`
            > Set current language and trigger change listeners.

            ```typescript
            await i18n.setLanguage('ar')
            // Language is changed and persisted to storage if available
            ```

        - #### `getLanguage(): LanguageCode`
            > Get current language code.

            ```typescript
            const lang = i18n.getLanguage() // "en"
            ```

        - #### `getSupportedLanguages(): LanguageCode[]`
            > Get array of all supported languages.

            ```typescript
            const langs = i18n.getSupportedLanguages() // ['en', 'ar', 'fr']
            ```

        - #### `isLanguageSupported(lang: LanguageCode): boolean`
            > Check if a language is supported.

            ```typescript
            i18n.isLanguageSupported('ar') // true
            i18n.isLanguageSupported('unsupported') // false
            ```

        - #### `hasKey(key: string): boolean`
            > Check if translation key exists in current or fallback language.

            ```typescript
            i18n.hasKey('greeting') // true
            i18n.hasKey('missing') // false
            ```

        - #### `getTranslations(): Record<string, string>`
            > Get all translations for current language.

            ```typescript
            const all = i18n.getTranslations()
            ```

        - #### `isRTL(): boolean`
            > Check if current language is right-to-left.

            ```typescript
            await i18n.setLanguage('ar')
            i18n.isRTL() // true

            await i18n.setLanguage('en')
            i18n.isRTL() // false
            ```

        - #### `isRTLLanguage(lang: LanguageCode): boolean`
            > Check if specific language is right-to-left.

            ```typescript
            i18n.isRTLLanguage('ar') // true
            i18n.isRTLLanguage('he') // true
            i18n.isRTLLanguage('en') // false
            ```

        - #### `onChange(callback: (lang: LanguageCode) => void): () => void`
            > Subscribe to language changes. Returns unsubscribe function.

            ```typescript
            const unsubscribe = i18n.onChange((lang) => {
                console.log('Language changed to:', lang)
                updateUI(lang)
            })

            // Unsubscribe later
            unsubscribe()
            ```

    <br>

    - ### LazyLoader Class

        - #### `constructor(baseUrl: string, manager: I18nManager)`
            > Create a lazy loader for on-demand language loading.

            ```typescript
            const manager = new I18nManager({
                supportedLanguages: ['en', 'ar', 'fr']
            })
            const loader = new LazyLoader('https://cdn.com/i18n/', manager)
            ```

        - #### `load(lang: LanguageCode): Promise<void>`
            > Load a language file on-demand. Caches promises to prevent duplicate requests.

            ```typescript
            await loader.load('ar')
            // Expects https://cdn.com/i18n/ar.json

            // Subsequent calls return cached promise
            await loader.load('ar') // Returns immediately
            ```

        - #### `isLoaded(lang: LanguageCode): boolean`
            > Check if language is already loaded.

            ```typescript
            if (!loader.isLoaded('ar')) {
                await loader.load('ar')
            }
            ```

    <br>

    - ### Storage Adapters

        - #### `browserStorage: I18nStorage`
            > Store language preference in browser localStorage.

            ```typescript
            import { browserStorage } from '@minejs/i18n'

            const i18n = new I18nManager({
                storage: browserStorage
            })
            ```

        - #### `memoryStorage: I18nStorage`
            > In-memory storage (useful for SSR and testing).

            ```typescript
            import { memoryStorage } from '@minejs/i18n'

            const i18n = new I18nManager({
                storage: memoryStorage
            })
            ```

        - #### `fetchTranslations(urls: string | string[], manager: I18nManager): Promise<void>`
            > Fetch translations from remote URLs. Extracts language from filename (e.g., `en.json`).

            ```typescript
            import { fetchTranslations } from '@minejs/i18n'

            const manager = new I18nManager()

            // Single URL
            await fetchTranslations('https://cdn.com/i18n/en.json', manager)

            // Multiple URLs
            await fetchTranslations([
                'https://cdn.com/i18n/en.json',
                'https://cdn.com/i18n/ar.json'
            ], manager)
            ```

    <br>

    - ### Global Instance Functions

        - #### `getI18n(): I18nManager`
            > Get or create global I18n instance.

            ```typescript
            const i18n = getI18n()
            ```

        - #### `setupI18n(config: I18nConfig): Promise<I18nManager>`
            > Initialize global instance with config.

            ```typescript
            const i18n = await setupI18n({
                defaultLanguage: 'en',
                supportedLanguages: ['en', 'ar', 'fr']
            })
            ```

        - #### `createLazyLoader(baseUrl: string, fileExtension?: string): LazyLoader`
            > Create lazy loader for global instance with support for custom file extensions.

            ```typescript
            const loader = createLazyLoader('https://cdn.com/i18n/', 'json')
            await loader.load('ar')
            ```

        - #### `setupLazy(config: I18nConfig & {basePath?: string; baseUrl?: string}): Promise<LazyLoader>`
            > Setup with lazy loading and load default language only. Supports both file paths and URLs.

            ```typescript
            const loader = await setupLazy({
                defaultLanguage: 'en',
                supportedLanguages: ['en', 'ar', 'fr'],
                basePath: '/i18n/'
            })
            ```

        - #### `setupAuto(config: I18nConfig & {basePath: string}): Promise<LazyLoader>`
            > Auto-setup with environment detection. Automatically uses fetch in browser and file system on server.

            ```typescript
            // Works in both browser and Node.js
            const loader = await setupAuto({
                defaultLanguage: 'en',
                supportedLanguages: ['en', 'ar', 'fr'],
                basePath: 'http://localhost:3000/i18n/',
                fileExtension: 'json'
            })
            ```

            ```typescript
            const loader = await setupLazy({
                defaultLanguage: 'en',
                supportedLanguages: ['en', 'ar', 'fr'],
                baseUrl: 'https://cdn.com/i18n/'
            })
            ```

    <br>

    - ### Convenience Functions (Global Instance)

        - #### `t(key: string, params?: object): string`
            > Translate using global instance.

        - #### `tLang(key: string, lang: LanguageCode, params?: object): string`
            > Translate with specific language using global instance.

        - #### `tParse(key: string, params?: object): TranslationToken[]`
            > Parse translation using global instance.

        - #### `setLanguage(lang: LanguageCode): Promise<void>`
            > Set language on global instance.

        - #### `getLanguage(): LanguageCode`
            > Get current language from global instance.

        - #### `getSupportedLanguages(): LanguageCode[]`
            > Get supported languages from global instance.

        - #### `hasKey(key: string): boolean`
            > Check if key exists in global instance.

        - #### `isRTL(): boolean`
            > Check if current language is RTL on global instance.

        - #### `isRTLLanguage(lang: LanguageCode): boolean`
            > Check if specific language is RTL.

        - #### `onChange(callback: (lang: LanguageCode) => void): () => void`
            > Subscribe to language changes on global instance.

        - #### `loadLanguage(lang: LanguageCode, translations: object): void`
            > Load translations using global instance.

        - #### `loadTranslations(translations: TranslationSet): void`
            > Load multiple languages using global instance.

    <br>

    - ### Utility Functions

        - #### `genPageTitle(key: string, prefix?: string): string`
            > Generate page title with app name and proper RTL formatting.

            ```typescript
            // LTR: "Page Name - App Name"
            // RTL: "App Name - Page Name"

            const title = genPageTitle('home', 'page.')
            // Translates 'page.home' and 'app.name'
            ```

        - #### `plural(count: number, singleKey: string, pluralKey: string): string`
            > Select translation based on count and replace {count} parameter.

            ```typescript
            loadLanguage('en', {
                'item.single': '1 item',
                'item.plural': '{count} items'
            })

            plural(1, 'item.single', 'item.plural') // "1 item"
            plural(5, 'item.single', 'item.plural') // "5 items"
            ```

    <br>

- ## Types 📘

    ```typescript
    type LanguageCode = string

    interface I18nConfig {
        defaultLanguage?: LanguageCode
        supportedLanguages?: LanguageCode[]
        fallbackLanguage?: LanguageCode
        onLanguageChange?: (lang: LanguageCode) => void
        storage?: I18nStorage
        basePath?: string
        fileExtension?: string
    }

    interface I18nStorage {
        get(key: string): string | null | Promise<string | null>
        set(key: string, value: string): void | Promise<void>
    }

    interface TranslationToken {
        type: 'text' | 'tag'
        tag?: string
        content: string
    }

    type TranslationSet = Record<string, Record<string, string>>
    ```

    <br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>

---

<div align="center">
    <a href="https://github.com/maysara-elshewehy"><img src="https://img.shields.io/badge/by-Maysara-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->