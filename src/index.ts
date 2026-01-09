// src/index.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as types from './types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class I18nManager {

        // ┌──────────────────────────────── STATE ─────────────────────────────┐

            private translations        : types.TranslationSet = {};
            private currentLanguage     : types.LanguageCode = 'en';
            private defaultLanguage     : types.LanguageCode = 'en';
            private fallbackLanguage    : types.LanguageCode = 'en';
            private supportedLanguages  = new Set<types.LanguageCode>(['en']);
            private rtlLanguages        = new Set<string>(['ar', 'he', 'fa', 'ur', 'yi', 'ji', 'iw', 'ku']);
            private listeners           = new Set<(lang: types.LanguageCode) => void>();
            private storage?            : types.I18nStorage;
            private onLanguageChange?   : (lang: types.LanguageCode) => void;

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            constructor(config?: types.I18nConfig) {
                if (config) {
                    this.defaultLanguage = config.defaultLanguage || 'en';
                    this.fallbackLanguage = config.fallbackLanguage || config.defaultLanguage || 'en';
                    this.currentLanguage = config.defaultLanguage || 'en';
                    this.storage = config.storage;
                    this.onLanguageChange = config.onLanguageChange;

                    if (config.supportedLanguages) {
                        this.supportedLanguages = new Set(config.supportedLanguages);
                    }
                }
            }

            /**
             * Initialize with stored language preference
             */
            public async init(): Promise<void> {
                if (this.storage) {
                    const stored = await this.storage.get('i18n-language');
                    if (stored && this.supportedLanguages.has(stored)) {
                        this.currentLanguage = stored;
                    }
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── LOADING ────────────────────────────┐

            /**
             * Load translations for a specific language
             * @param lang Language code
             * @param translations Translation object (can be nested)
             */
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            public loadLanguage(lang: types.LanguageCode, translations: Record<string, any>): void {
                if (!this.translations[lang]) {
                    this.translations[lang] = {};
                }

                const flattened = this.flattenObject(translations);
                this.translations[lang] = { ...this.translations[lang], ...flattened };
                this.supportedLanguages.add(lang);
            }

            /**
             * Load multiple languages at once
             * @param translations Object with language codes as keys
             */
            public loadTranslations(translations: types.TranslationSet): void {
                Object.entries(translations).forEach(([lang, trans]) => {
                    this.loadLanguage(lang, trans);
                });
            }

            /**
             * Flatten nested object into dot notation
             * @private
             */
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            private flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, string> {
                const flattened: Record<string, string> = {};

                for (const key in obj) {
                    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

                    const value = obj[key];
                    const newKey = prefix ? `${prefix}.${key}` : key;

                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        Object.assign(flattened, this.flattenObject(value, newKey));
                    } else {
                        flattened[newKey] = String(value);
                    }
                }

                return flattened;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌───────────────────────────── TRANSLATION ──────────────────────────┐

            /**
             * Translate a key with parameter replacement
             *
             * @example
             * t('welcome.message', { name: 'John' })
             * // => "Welcome, John!"
             *
             * @param key Translation key (dot notation)
             * @param params Optional parameters for replacement
             * @returns Translated string
             */
            public t(key: string, params?: Record<string, string>): string {
                let translation = this.getTranslation(key);

                if (params) {
                    Object.entries(params).forEach(([param, value]) => {
                        // Check if parameter value is itself a translation key
                        const paramValue = this.getTranslation(value, value);
                        translation = translation.replace(
                            new RegExp(`\\{${param}\\}`, 'g'),
                            paramValue
                        );
                    });
                }

                return translation;
            }

            /**
             * Get raw translation without parameter replacement
             * @private
             */
            private getTranslation(key: string, fallback?: string): string {
                // Try current language
                if (this.translations[this.currentLanguage]?.[key]) {
                    return this.translations[this.currentLanguage][key];
                }

                // Try fallback language
                if (this.fallbackLanguage !== this.currentLanguage &&
                    this.translations[this.fallbackLanguage]?.[key]) {
                    return this.translations[this.fallbackLanguage][key];
                }

                // Try default language
                if (this.defaultLanguage !== this.currentLanguage &&
                    this.defaultLanguage !== this.fallbackLanguage &&
                    this.translations[this.defaultLanguage]?.[key]) {
                    return this.translations[this.defaultLanguage][key];
                }

                // Warn and return fallback
                console.warn(`[i18n] Translation key not found: "${key}" (lang: ${this.currentLanguage})`);
                return fallback || key;
            }

            /**
             * Translate with a specific language temporarily
             *
             * @param key Translation key
             * @param lang Language code
             * @param params Optional parameters
             */
            public tLang(key: string, lang: types.LanguageCode, params?: Record<string, string>): string {
                const original = this.currentLanguage;
                this.currentLanguage = lang;
                const result = this.t(key, params);
                this.currentLanguage = original;
                return result;
            }

            /**
             * Translate and parse HTML-like tags into tokens
             * Converts \n or /n to line breaks
             *
             * @example
             * // Translation: "Hello\nWorld <strong>here</strong>"
             * tParse('message')
             * // => [
             * //   { type: 'text', content: 'Hello' },
             * //   { type: 'tag', tag: 'br', content: '' },
             * //   { type: 'text', content: 'World ' },
             * //   { type: 'tag', tag: 'strong', content: 'here' }
             * // ]
             *
             * @param key Translation key
             * @param params Optional parameters
             * @returns Array of tokens
             */
            public tParse(key: string, params?: Record<string, string>): types.TranslationToken[] {
                let translation = this.t(key, params);

                // Convert newlines to <br> tags
                translation = translation.replace(/\\n|\/n/g, '<br>');

                const tokens: types.TranslationToken[] = [];
                const regex = /<([a-z]+)>([^<]*)<\/\1>|<([a-z]+)\s*\/?>|([^<]+)/gi;
                let match;

                while ((match = regex.exec(translation)) !== null) {
                    if (match[4]) {
                        // Plain text
                        tokens.push({ type: 'text', content: match[4] });
                    } else if (match[1]) {
                        // Paired tag: <strong>text</strong>
                        tokens.push({ type: 'tag', tag: match[1], content: match[2] });
                    } else if (match[3]) {
                        // Self-closing: <br> or <br/>
                        tokens.push({ type: 'tag', tag: match[3], content: '' });
                    }
                }

                return tokens.length > 0 ? tokens : [{ type: 'text', content: translation }];
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌────────────────────────────── LANGUAGE ────────────────────────────┐

            /**
             * Set current language
             */
            public async setLanguage(lang: types.LanguageCode): Promise<void> {
                if (!this.supportedLanguages.has(lang)) {
                    console.warn(`[i18n] Language "${lang}" not supported`);
                    return;
                }

                this.currentLanguage = lang;

                // Persist if storage available
                if (this.storage) {
                    await this.storage.set('i18n-language', lang);
                }

                // Notify listeners
                this.listeners.forEach(fn => fn(lang));

                if (this.onLanguageChange) {
                    this.onLanguageChange(lang);
                }
            }

            /**
             * Get current language
             */
            public getLanguage(): types.LanguageCode {
                return this.currentLanguage;
            }

            /**
             * Get all supported languages
             */
            public getSupportedLanguages(): types.LanguageCode[] {
                return Array.from(this.supportedLanguages);
            }

            /**
             * Check if language is supported
             */
            public isLanguageSupported(lang: types.LanguageCode): boolean {
                return this.supportedLanguages.has(lang);
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── HELPERS ────────────────────────────┐

            /**
             * Check if a translation key exists
             */
            public hasKey(key: string): boolean {
                return !!(
                    this.translations[this.currentLanguage]?.[key] ||
                    this.translations[this.fallbackLanguage]?.[key] ||
                    this.translations[this.defaultLanguage]?.[key]
                );
            }

            /**
             * Get all translations for current language
             */
            public getTranslations(): Record<string, string> {
                return this.translations[this.currentLanguage] || {};
            }

            /**
             * Check if current language is RTL
             */
            public isRTL(): boolean {
                return this.rtlLanguages.has(this.currentLanguage.toLowerCase().substring(0, 2));
            }

            /**
             * Check if specific language is RTL
             */
            public isRTLLanguage(lang: types.LanguageCode): boolean {
                return this.rtlLanguages.has(lang.toLowerCase().substring(0, 2));
            }

            /**
             * Subscribe to language changes
             * @returns Unsubscribe function
             */
            public onChange(callback: (lang: types.LanguageCode) => void): () => void {
                this.listeners.add(callback);
                return () => this.listeners.delete(callback);
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ ════ ════════════════════════════════════════╗

    /**
     * Browser storage adapter using localStorage
     */
    export const browserStorage: types.I18nStorage = {
        get: (key: string) => {
            if (typeof localStorage === 'undefined') return null;
            return localStorage.getItem(key);
        },
        set: (key: string, value: string) => {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
        }
    };

    /**
     * Memory storage adapter (for server/testing)
     */
    export const memoryStorage = (() => {
        const store = new Map<string, string>();
        return {
            get: (key: string) => store.get(key) || null,
            set: (key: string, value: string) => { store.set(key, value); }
        };
    })();

    /**
     * Fetch translations from URLs
     * Works in both browser and Node.js (with node-fetch)
     */
    export async function fetchTranslations(
        urls: string | string[],
        manager: I18nManager
    ): Promise<void> {
        const urlList = Array.isArray(urls) ? urls : [urls];
        const translations: types.TranslationSet = {};

        for (const url of urlList) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    // Extract language from filename: /path/en.json -> en
                    const langMatch = url.match(/([a-z]{2,3})\.json$/i);
                    const lang = langMatch ? langMatch[1].toLowerCase() : 'en';
                    translations[lang] = data;
                }
            } catch (error) {
                console.warn(`[i18n] Failed to fetch: ${url}`, error);
            }
        }

        if (Object.keys(translations).length > 0) {
            manager.loadTranslations(translations);
        }
    }

    /**
     * Lazy loader: fetch language only when needed
     * Prevents loading all languages at startup
     */
    export class LazyLoader {
        private baseUrl: string;
        private manager: I18nManager;
        private loading = new Map<types.LanguageCode, Promise<void>>();
        private loaded = new Set<types.LanguageCode>();
        private isServerSide: boolean;
        private fileExtension: string;

        constructor(baseUrl: string, manager: I18nManager, fileExtension: string = 'json') {
            this.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
            this.manager = manager;
            this.fileExtension = fileExtension;
            this.isServerSide = typeof fetch === 'undefined';
        }

        /**
         * Load a language file on-demand
         * Caches the promise to prevent duplicate requests
         */
        async load(lang: types.LanguageCode): Promise<void> {
            // Already loaded
            if (this.loaded.has(lang)) {
                return;
            }

            // Currently loading
            if (this.loading.has(lang)) {
                return this.loading.get(lang);
            }

            // Start loading
            const promise = this.doLoad(lang);
            this.loading.set(lang, promise);

            try {
                await promise;
                this.loaded.add(lang);
            } finally {
                this.loading.delete(lang);
            }
        }

        private async doLoad(lang: types.LanguageCode): Promise<void> {
            try {
                const filePath = `${this.baseUrl}${lang}.${this.fileExtension}`;

                let data: Record<string, string> | null;

                // Check if it's a local file path (relative or absolute)
                const isLocalPath = filePath.startsWith('.') || filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath);

                if (isLocalPath || this.isServerSide) {
                    // Node.js/local: Read from filesystem
                    data = await this.loadFromFile(filePath);
                } else {
                    // Browser: Fetch from URL
                    data = await this.loadFromUrl(filePath);
                }

                if (data) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    this.manager.loadLanguage(lang, data as Record<string, any>);
                }
            } catch (error) {
                console.warn(`[i18n] Error loading language: ${lang}`, error);
            }
        }

        private async loadFromUrl(url: string): Promise<Record<string, string> | null> {
            try {
                const response = await fetch(url);

                if (response.ok) {
                    return await response.json();
                } else {
                    console.warn(`[i18n] Failed to load language from URL: ${url} (${response.status})`);
                    return null;
                }
            } catch (error) {
                console.warn(`[i18n] Error fetching from URL: ${url}`, error);
                return null;
            }
        }

        private async loadFromFile(filePath: string): Promise<Record<string, string> | null> {
            try {
                // Dynamic import to avoid issues in browsers
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fs = await import('fs').then(m => m.promises).catch((): any => null);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const path = await import('path').then(m => m).catch((): any => null);

                if (!fs) {
                    console.warn('[i18n] fs module not available. Running in browser?');
                    return null;
                }

                // Resolve relative paths to absolute paths
                let resolvedPath = filePath;
                if (path && !path.isAbsolute(filePath)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const process = await import('process').then(m => m).catch((): any => null);
                    if (process) {
                        resolvedPath = path.resolve(process.cwd(), filePath);
                    }
                }

                const content = await fs.readFile(resolvedPath, 'utf-8');
                return JSON.parse(content);
            } catch (error) {
                console.warn(`[i18n] Error reading file: ${filePath}`, error);
                return null;
            }
        }

        isLoaded(lang: types.LanguageCode): boolean {
            return this.loaded.has(lang);
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ ════ ════════════════════════════════════════╗

    let instance: I18nManager | null = null;

    /**
     * Get or create the global i18n instance
     */
    export function getI18n(): I18nManager {
        if (!instance) {
            instance = new I18nManager();
        }
        return instance;
    }

    /**
     * Initialize i18n with config
     * Call this once at app startup
     *
     * @example
     * // Load only default language at startup
     * await setupI18n({
     *   defaultLanguage: 'en',
     *   supportedLanguages: ['en', 'ar', 'fr', 'de']
     * });
     */
    export async function setupI18n(config: types.I18nConfig): Promise<I18nManager> {
        instance = new I18nManager(config);
        await instance.init();
        return instance;
    }

    /**
     * Create a lazy loader for translations
     * Only loads languages when needed
     *
     * @example
     * const loader = createLazyLoader('https://mycdn.com/i18n/');
     *
     * // Later, when user switches language:
     * await loader.load('ar');
     * await setLanguage('ar');
     */
    export function createLazyLoader(baseUrl: string, fileExtension: string = 'json'): LazyLoader {
        return new LazyLoader(baseUrl, getI18n(), fileExtension);
    }

    /**
     * Setup i18n with lazy loading
     * Only loads the default language at startup
     *
     * @example
     * // Browser
     * const loader = await setupLazy({
     *   defaultLanguage: 'en',
     *   supportedLanguages: ['en', 'ar', 'fr', 'de', 'zh'],
     *   basePath: '/i18n/'
     * });
     *
     * // Later when user switches:
     * await loader.load('ar');
     * await setLanguage('ar');
     */
    export async function setupLazy(config: types.I18nConfig & { basePath?: string; baseUrl?: string }): Promise<LazyLoader> {
        const manager = new I18nManager(config);
        await manager.init();
        instance = manager;

        const basePath = config.basePath || config.baseUrl || './locales/';
        const fileExtension = config.fileExtension || 'json';
        const loader = new LazyLoader(basePath, manager, fileExtension);

        // Load only the current language at startup
        await loader.load(manager.getLanguage());

        return loader;
    }

    /**
     * Auto-setup: Smart initialization based on environment and config
     * Automatically handles browser vs server and file vs URL loading
     *
     * @example
     * // Browser: Auto-fetches from server
     * const loader = await setupAuto({
     *   defaultLanguage: 'en',
     *   supportedLanguages: ['en', 'ar', 'fr'],
     *   basePath: 'http://localhost:3000/static/i18n/'
     * });
     *
     * // Server (Node.js): Auto-reads from filesystem
     * const loader = await setupAuto({
     *   defaultLanguage: 'en',
     *   supportedLanguages: ['en', 'ar', 'fr'],
     *   basePath: './public/locales/'
     * });
     */
    export async function setupAuto(config: types.I18nConfig & { basePath: string }): Promise<LazyLoader> {
        const manager = new I18nManager(config);
        await manager.init();
        instance = manager;

        const fileExtension = config.fileExtension || 'json';
        const loader = new LazyLoader(config.basePath, manager, fileExtension);

        // Auto-load default language
        await loader.load(manager.getLanguage());

        return loader;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ ════ ════════════════════════════════════════╗

    export const t = (key: string, params?: Record<string, string>) =>
        getI18n().t(key, params);

    export const tLang = (key: string, lang: types.LanguageCode, params?: Record<string, string>) =>
        getI18n().tLang(key, lang, params);

    export const tParse = (key: string, params?: Record<string, string>) =>
        getI18n().tParse(key, params);

    export const setLanguage = (lang: types.LanguageCode) =>
        getI18n().setLanguage(lang);

    export const getLanguage = () =>
        getI18n().getLanguage();

    export const getSupportedLanguages = () =>
        getI18n().getSupportedLanguages();

    export const hasKey = (key: string) =>
        getI18n().hasKey(key);

    export const isRTL = () =>
        getI18n().isRTL();

    export const isRTLLanguage = (lang: types.LanguageCode) =>
        getI18n().isRTLLanguage(lang);

    export const onChange = (callback: (lang: types.LanguageCode) => void) =>
        getI18n().onChange(callback);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const loadLanguage = (lang: types.LanguageCode, translations: Record<string, any>) =>
        getI18n().loadLanguage(lang, translations);

    export const loadTranslations = (translations: types.TranslationSet) =>
        getI18n().loadTranslations(translations);

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ ════ ════════════════════════════════════════╗

    /**
     * Generate page title with proper RTL handling
     *
     * @example
     * // English: "Profile - MyApp"
     * // Arabic: "MyApp - الملف الشخصي"
     * genPageTitle('profile', 'page.')
     */
    export function genPageTitle(key: string, prefix: string = 'page.'): string {
        const appName = t('app.name');
        const pageName = t(prefix + key);
        return isRTL() ? `${appName} - ${pageName}` : `${pageName} - ${appName}`;
    }

    /**
     * Pluralization helper
     *
     * @example
     * plural(1, 'item.single', 'item.plural') // "1 item"
     * plural(5, 'item.single', 'item.plural') // "5 items"
     */
    export function plural(count: number, singleKey: string, pluralKey: string): string {
        const key = count === 1 ? singleKey : pluralKey;
        return t(key, { count: String(count) });
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ ════ ════════════════════════════════════════╗

    export default {
        I18nManager,
        getI18n,
        setupI18n,
        createLazyLoader,
        setupLazy,
        setupAuto,
        browserStorage,
        memoryStorage,
        fetchTranslations,
        genPageTitle,
        plural,
    };


    export type I18nManagerInstance = InstanceType<typeof I18nManager>;
    export type LazyLoaderInstance = InstanceType<typeof LazyLoader>;

    export * from './types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝