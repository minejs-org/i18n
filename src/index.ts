// src/index.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as types from './types';
    import { I18nManager } from './mod/i18n';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * Storage adapter for browser (localStorage)
     */
    const createBrowserStorage = (): types.I18nStorage => ({
        get: (key: string) => {
            if (typeof localStorage === 'undefined') return null;
            return localStorage.getItem(key);
        },
        set: (key: string, value: string) => {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
        }
    });

    /**
     * Storage adapter for memory (in-process storage)
     */
    const createMemoryStorage = (): types.I18nStorage => {
        const store = new Map<string, string>();
        return {
            get: (key: string) => store.get(key) || null,
            set: (key: string, value: string) => { store.set(key, value); }
        };
    };

    /**
     * Auto-select appropriate storage based on environment
     */
    const getDefaultStorage = (): types.I18nStorage => {
        return typeof localStorage !== 'undefined' ? createBrowserStorage() : createMemoryStorage();
    };

    /**
     * Lazy loader: fetch language on-demand
     * Supports both URL-based (browser) and file-based (server) loading
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
           // console.log(`[LazyLoader] load() called for language: "${lang}"`);

            // Already loaded
            if (this.loaded.has(lang)) {
               // console.log(`[LazyLoader] Language "${lang}" already loaded, returning immediately`);
                return;
            }

            // Currently loading
            if (this.loading.has(lang)) {
               // console.log(`[LazyLoader] Language "${lang}" is currently loading, returning existing promise`);
                return this.loading.get(lang);
            }

            // Start loading
           // console.log(`[LazyLoader] Starting to load language: "${lang}"`);
            const promise = this.doLoad(lang);
            this.loading.set(lang, promise);

            try {
                await promise;
                this.loaded.add(lang);
               // console.log(`[LazyLoader] Language "${lang}" loaded and marked as loaded`);
            } catch (error) {
                console.error(`[LazyLoader] Error loading language "${lang}":`, error);
            } finally {
                this.loading.delete(lang);
            }
        }

        private async doLoad(lang: types.LanguageCode): Promise<void> {
            try {
                const filePath = `${this.baseUrl}${lang}.${this.fileExtension}`;
               // console.log(`[LazyLoader] doLoad() - filePath: "${filePath}"`);
               // console.log(`[LazyLoader] isServerSide: ${this.isServerSide}`);

                let data: Record<string, string> | null;

                // Check if it's a local file path (relative or absolute)
                const isLocalPath = filePath.startsWith('.') || filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath);
               // console.log(`[LazyLoader] isLocalPath: ${isLocalPath}`);

                if (isLocalPath || this.isServerSide) {
                    // Node.js/local: Read from filesystem
                   // console.log(`[LazyLoader] Loading from file...`);
                    data = await this.loadFromFile(filePath);
                } else {
                    // Browser: Fetch from URL
                   // console.log(`[LazyLoader] Loading from URL...`);
                    data = await this.loadFromUrl(filePath);
                }

                if (data) {
                   // console.log(`[LazyLoader] Data loaded successfully, keys:`, Object.keys(data).length);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    this.manager.loadLanguage(lang, data as Record<string, any>);
                } else {
                    console.warn(`[LazyLoader] No data loaded for language: "${lang}"`);
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
    let lazyLoader: LazyLoader | null = null;

    /**
     * Get browser language preference
     * Uses navigator.language if available (browser environment)
     * @private
     */
    function detectBrowserLanguage(): string {
        if (typeof navigator !== 'undefined' && navigator.language) {
            return navigator.language.split('-')[0].toLowerCase();
        }
        return 'en';
    }

    /**
     * Check if running in browser environment
     * @private
     */
    function isBrowser(): boolean {
        return typeof fetch !== 'undefined' && typeof window !== 'undefined';
    }

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
     * Get the lazy loader instance (only available after setupI18n with basePath)
     */
    export function getLazyLoader(): LazyLoader | null {
        return lazyLoader;
    }

    /**
     * Main setup function - Single, simple, auto-detecting initialization
     *
     * Auto-detects environment and handles both browser and server:
     * - Browser: Auto-detects language, loads from URL path
     * - Server: Uses defaultLanguage, loads from file system
     *
     * Call this ONCE at app startup.
     *
     * @example
     * // Browser - Auto-detects language, lazy-loads from URL
     * await setupI18n({
     *   supportedLanguages: ['en', 'ar', 'fr'],
     *   basePath: '/i18n/'
     * });
     *
     * @example
     * // Server - Uses default language, lazy-loads from filesystem
     * await setupI18n({
     *   defaultLanguage: 'en',
     *   supportedLanguages: ['en', 'ar', 'fr'],
     *   basePath: './locales/'
     * });
     */
    export async function setupI18n(
        config: types.I18nConfig & { basePath?: string }
    ): Promise<I18nManager> {

        // Auto-detect browser language if in browser and no defaultLanguage specified
        if (isBrowser() && !config.defaultLanguage) {
            const detectedLang = detectBrowserLanguage();
            if (config.supportedLanguages?.includes(detectedLang)) {
                config.defaultLanguage = detectedLang;
            } else {
                config.defaultLanguage = config.supportedLanguages?.[0] || 'en';
            }
        }

        // Use appropriate storage based on environment
        if (!config.storage) {
            config.storage = getDefaultStorage();
        }

        // Create and initialize manager
        instance = new I18nManager(config);
        await instance.init();

        // Setup lazy loading if basePath provided
        if (config.basePath) {
            const fileExtension = config.fileExtension || 'json';
            lazyLoader = new LazyLoader(config.basePath, instance, fileExtension);
            await lazyLoader.load(instance.getLanguage());
        }

        return instance;
    }



// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CONVENIENCE FUNCTIONS ════════════════════════════════════════╗

    /**
     * Translate a key with optional parameter replacement
     */
    export const t = (key: string, params?: Record<string, string>, fallback?: string) =>
        getI18n().t(key, params, fallback);

    /**
     * Translate a key with a specific language temporarily
     */
    export const tLang = (lang: types.LanguageCode, key: string, params?: Record<string, string>, fallback?: string) =>
        getI18n().tLang(lang, key, params, fallback);

    /**
     * Translate a key with a specific language - async version that loads language if needed
     * Use this on server-side with lazy loading to ensure language is loaded first
     */
    export const tLangAsync = async (lang: types.LanguageCode, key: string, params?: Record<string, string>, fallback?: string): Promise<string> => {
        // console.log(`[i18n] tLangAsync() called: lang="${lang}", key="${key}"`);

        // Load language if lazy loader available
        if (lazyLoader && !lazyLoader.isLoaded(lang)) {
            // console.log(`[i18n] Language "${lang}" not loaded, loading now...`);
            await lazyLoader.load(lang);
            // console.log(`[i18n] Language "${lang}" loaded successfully`);
        } else if (lazyLoader) {
            // console.log(`[i18n] Language "${lang}" already loaded`);
        } else {
            // console.log(`[i18n] No LazyLoader available`);
        }

        const result = getI18n().tLang(lang, key, params, fallback);
        // console.log(`[i18n] tLangAsync() result: "${result}"`);
        return result;
    };

    /**
     * Parse translation with HTML tags into tokens
     */
    export const tParse = (key: string, params?: Record<string, string>, fallback?: string) =>
        getI18n().tParse(key, params, fallback);

    /**
     * Set current language and trigger listeners
     */
    export const setLanguage = (lang: types.LanguageCode): Promise<void> => {
        // Load language if lazy loader available
        if (lazyLoader && !lazyLoader.isLoaded(lang)) {
            return lazyLoader.load(lang).then(() => getI18n().setLanguage(lang));
        }
        return getI18n().setLanguage(lang);
    };

    /**
     * Get current language code
     */
    export const getLanguage = () =>
        getI18n().getLanguage();

    /**
     * Get all supported languages
     */
    export const getSupportedLanguages = () =>
        getI18n().getSupportedLanguages();

    /**
     * Check if translation key exists
     */
    export const hasKey = (key: string) =>
        getI18n().hasKey(key);

    /**
     * Check if current language is RTL
     */
    export const isRTL = () =>
        getI18n().isRTL();

    /**
     * Check if specific language is RTL
     */
    export const isRTLLanguage = (lang: types.LanguageCode) =>
        getI18n().isRTLLanguage(lang);

    /**
     * Subscribe to language changes
     */
    export const onChange = (callback: (lang: types.LanguageCode) => void) =>
        getI18n().onChange(callback);

    /**
     * Load translations for a specific language
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const loadLanguage = (lang: types.LanguageCode, translations: Record<string, any>) =>
        getI18n().loadLanguage(lang, translations);

    /**
     * Load multiple languages at once
     */
    export const loadTranslations = (translations: types.TranslationSet) =>
        getI18n().loadTranslations(translations);

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ UTILITY FUNCTIONS ════════════════════════════════════════╗

    /**
     * Pluralization helper - select translation based on count
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



// ╔════════════════════════════════════════ EXPORTS ════════════════════════════════════════╗

    export default {
        setupI18n,
        getI18n,
        getLazyLoader,
        I18nManager,
        LazyLoader,
        t,
        tLang,
        tParse,
        setLanguage,
        getLanguage,
        getSupportedLanguages,
        hasKey,
        isRTL,
        isRTLLanguage,
        onChange,
        loadLanguage,
        loadTranslations,
        plural,
    };

    export type I18nManagerInstance = InstanceType<typeof I18nManager>;
    export type LazyLoaderInstance = InstanceType<typeof LazyLoader>;

    export * from './mod/i18n';
    export * from './types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
