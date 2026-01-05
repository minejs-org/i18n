type LanguageCode = string;
type TranslationSet = Record<string, Record<string, string>>;
interface I18nConfig {
    defaultLanguage?: LanguageCode;
    supportedLanguages?: LanguageCode[];
    fallbackLanguage?: LanguageCode;
    onLanguageChange?: (lang: LanguageCode) => void;
    storage?: I18nStorage;
    basePath?: string;
    fileExtension?: string;
}
interface I18nStorage {
    get(key: string): string | null | Promise<string | null>;
    set(key: string, value: string): void | Promise<void>;
}
interface TranslationToken {
    type: 'text' | 'tag';
    tag?: string;
    content: string;
}

declare class I18nManager {
    private translations;
    private currentLanguage;
    private defaultLanguage;
    private fallbackLanguage;
    private supportedLanguages;
    private rtlLanguages;
    private listeners;
    private storage?;
    private onLanguageChange?;
    constructor(config?: I18nConfig);
    /**
     * Initialize with stored language preference
     */
    init(): Promise<void>;
    /**
     * Load translations for a specific language
     * @param lang Language code
     * @param translations Translation object (can be nested)
     */
    loadLanguage(lang: LanguageCode, translations: Record<string, any>): void;
    /**
     * Load multiple languages at once
     * @param translations Object with language codes as keys
     */
    loadTranslations(translations: TranslationSet): void;
    /**
     * Flatten nested object into dot notation
     * @private
     */
    private flattenObject;
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
    t(key: string, params?: Record<string, string>): string;
    /**
     * Get raw translation without parameter replacement
     * @private
     */
    private getTranslation;
    /**
     * Translate with a specific language temporarily
     *
     * @param key Translation key
     * @param lang Language code
     * @param params Optional parameters
     */
    tLang(key: string, lang: LanguageCode, params?: Record<string, string>): string;
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
    tParse(key: string, params?: Record<string, string>): TranslationToken[];
    /**
     * Set current language
     */
    setLanguage(lang: LanguageCode): Promise<void>;
    /**
     * Get current language
     */
    getLanguage(): LanguageCode;
    /**
     * Get all supported languages
     */
    getSupportedLanguages(): LanguageCode[];
    /**
     * Check if language is supported
     */
    isLanguageSupported(lang: LanguageCode): boolean;
    /**
     * Check if a translation key exists
     */
    hasKey(key: string): boolean;
    /**
     * Get all translations for current language
     */
    getTranslations(): Record<string, string>;
    /**
     * Check if current language is RTL
     */
    isRTL(): boolean;
    /**
     * Check if specific language is RTL
     */
    isRTLLanguage(lang: LanguageCode): boolean;
    /**
     * Subscribe to language changes
     * @returns Unsubscribe function
     */
    onChange(callback: (lang: LanguageCode) => void): () => void;
}
/**
 * Browser storage adapter using localStorage
 */
declare const browserStorage: I18nStorage;
/**
 * Memory storage adapter (for server/testing)
 */
declare const memoryStorage: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
};
/**
 * Fetch translations from URLs
 * Works in both browser and Node.js (with node-fetch)
 */
declare function fetchTranslations(urls: string | string[], manager: I18nManager): Promise<void>;
/**
 * Lazy loader: fetch language only when needed
 * Prevents loading all languages at startup
 */
declare class LazyLoader {
    private baseUrl;
    private manager;
    private loading;
    private loaded;
    private isServerSide;
    private fileExtension;
    constructor(baseUrl: string, manager: I18nManager, fileExtension?: string);
    /**
     * Load a language file on-demand
     * Caches the promise to prevent duplicate requests
     */
    load(lang: LanguageCode): Promise<void>;
    private doLoad;
    private loadFromUrl;
    private loadFromFile;
    isLoaded(lang: LanguageCode): boolean;
}
/**
 * Get or create the global i18n instance
 */
declare function getI18n(): I18nManager;
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
declare function setupI18n(config: I18nConfig): Promise<I18nManager>;
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
declare function createLazyLoader(baseUrl: string, fileExtension?: string): LazyLoader;
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
declare function setupLazy(config: I18nConfig & {
    basePath?: string;
    baseUrl?: string;
}): Promise<LazyLoader>;
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
declare function setupAuto(config: I18nConfig & {
    basePath: string;
}): Promise<LazyLoader>;
declare const t: (key: string, params?: Record<string, string>) => string;
declare const tLang: (key: string, lang: LanguageCode, params?: Record<string, string>) => string;
declare const tParse: (key: string, params?: Record<string, string>) => TranslationToken[];
declare const setLanguage: (lang: LanguageCode) => Promise<void>;
declare const getLanguage: () => string;
declare const getSupportedLanguages: () => string[];
declare const hasKey: (key: string) => boolean;
declare const isRTL: () => boolean;
declare const isRTLLanguage: (lang: LanguageCode) => boolean;
declare const onChange: (callback: (lang: LanguageCode) => void) => () => void;
declare const loadLanguage: (lang: LanguageCode, translations: Record<string, any>) => void;
declare const loadTranslations: (translations: TranslationSet) => void;
/**
 * Generate page title with proper RTL handling
 *
 * @example
 * // English: "Profile - MyApp"
 * // Arabic: "MyApp - الملف الشخصي"
 * genPageTitle('profile', 'page.')
 */
declare function genPageTitle(key: string, prefix?: string): string;
/**
 * Pluralization helper
 *
 * @example
 * plural(1, 'item.single', 'item.plural') // "1 item"
 * plural(5, 'item.single', 'item.plural') // "5 items"
 */
declare function plural(count: number, singleKey: string, pluralKey: string): string;
declare const _default: {
    I18nManager: typeof I18nManager;
    getI18n: typeof getI18n;
    setupI18n: typeof setupI18n;
    createLazyLoader: typeof createLazyLoader;
    setupLazy: typeof setupLazy;
    setupAuto: typeof setupAuto;
    browserStorage: I18nStorage;
    memoryStorage: {
        get: (key: string) => string | null;
        set: (key: string, value: string) => void;
    };
    fetchTranslations: typeof fetchTranslations;
    genPageTitle: typeof genPageTitle;
    plural: typeof plural;
};

type I18nManagerInstance = InstanceType<typeof I18nManager>;
type LazyLoaderInstance = InstanceType<typeof LazyLoader>;

export { type I18nConfig, I18nManager, type I18nManagerInstance, type I18nStorage, type LanguageCode, LazyLoader, type LazyLoaderInstance, type TranslationSet, type TranslationToken, browserStorage, createLazyLoader, _default as default, fetchTranslations, genPageTitle, getI18n, getLanguage, getSupportedLanguages, hasKey, isRTL, isRTLLanguage, loadLanguage, loadTranslations, memoryStorage, onChange, plural, setLanguage, setupAuto, setupI18n, setupLazy, t, tLang, tParse };
