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
     * @param fallback Optional fallback string if key not found
     * @returns Translated string
     */
    t(key: string, params?: Record<string, string>, fallback?: string): string;
    /**
     * Get raw translation without parameter replacement
     * @private
     */
    private getTranslation;
    /**
     * Translate with a specific language temporarily
     *
     * @param lang Language code
     * @param key Translation key
     * @param params Optional parameters
     * @param fallback Optional fallback string if key not found
     */
    tLang(lang: LanguageCode, key: string, params?: Record<string, string>, fallback?: string): string;
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
     * @param fallback Optional fallback string if key not found
     * @returns Array of tokens
     */
    tParse(key: string, params?: Record<string, string>, fallback?: string): TranslationToken[];
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
 * Lazy loader: fetch language on-demand
 * Supports both URL-based (browser) and file-based (server) loading
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
 * Get the lazy loader instance (only available after setupI18n with basePath)
 */
declare function getLazyLoader(): LazyLoader | null;
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
declare function setupI18n(config: I18nConfig & {
    basePath?: string;
}): Promise<I18nManager>;
/**
 * Translate a key with optional parameter replacement
 */
declare const t: (key: string, params?: Record<string, string>, fallback?: string) => string;
/**
 * Translate a key with a specific language temporarily
 */
declare const tLang: (lang: LanguageCode, key: string, params?: Record<string, string>, fallback?: string) => string;
/**
 * Translate a key with a specific language - async version that loads language if needed
 * Use this on server-side with lazy loading to ensure language is loaded first
 */
declare const tLangAsync: (lang: LanguageCode, key: string, params?: Record<string, string>, fallback?: string) => Promise<string>;
/**
 * Parse translation with HTML tags into tokens
 */
declare const tParse: (key: string, params?: Record<string, string>, fallback?: string) => TranslationToken[];
/**
 * Set current language and trigger listeners
 */
declare const setLanguage: (lang: LanguageCode) => Promise<void>;
/**
 * Get current language code
 */
declare const getLanguage: () => string;
/**
 * Get all supported languages
 */
declare const getSupportedLanguages: () => string[];
/**
 * Check if translation key exists
 */
declare const hasKey: (key: string) => boolean;
/**
 * Check if current language is RTL
 */
declare const isRTL: () => boolean;
/**
 * Check if specific language is RTL
 */
declare const isRTLLanguage: (lang: LanguageCode) => boolean;
/**
 * Subscribe to language changes
 */
declare const onChange: (callback: (lang: LanguageCode) => void) => () => void;
/**
 * Load translations for a specific language
 */
declare const loadLanguage: (lang: LanguageCode, translations: Record<string, any>) => void;
/**
 * Load multiple languages at once
 */
declare const loadTranslations: (translations: TranslationSet) => void;
/**
 * Pluralization helper - select translation based on count
 *
 * @example
 * plural(1, 'item.single', 'item.plural') // "1 item"
 * plural(5, 'item.single', 'item.plural') // "5 items"
 */
declare function plural(count: number, singleKey: string, pluralKey: string): string;
declare const _default: {
    setupI18n: typeof setupI18n;
    getI18n: typeof getI18n;
    getLazyLoader: typeof getLazyLoader;
    I18nManager: typeof I18nManager;
    LazyLoader: typeof LazyLoader;
    t: (key: string, params?: Record<string, string>, fallback?: string) => string;
    tLang: (lang: LanguageCode, key: string, params?: Record<string, string>, fallback?: string) => string;
    tParse: (key: string, params?: Record<string, string>, fallback?: string) => TranslationToken[];
    setLanguage: (lang: LanguageCode) => Promise<void>;
    getLanguage: () => string;
    getSupportedLanguages: () => string[];
    hasKey: (key: string) => boolean;
    isRTL: () => boolean;
    isRTLLanguage: (lang: LanguageCode) => boolean;
    onChange: (callback: (lang: LanguageCode) => void) => () => void;
    loadLanguage: (lang: LanguageCode, translations: Record<string, any>) => void;
    loadTranslations: (translations: TranslationSet) => void;
    plural: typeof plural;
};

type I18nManagerInstance = InstanceType<typeof I18nManager>;
type LazyLoaderInstance = InstanceType<typeof LazyLoader>;

export { type I18nConfig, I18nManager, type I18nManagerInstance, type I18nStorage, type LanguageCode, LazyLoader, type LazyLoaderInstance, type TranslationSet, type TranslationToken, _default as default, getI18n, getLanguage, getLazyLoader, getSupportedLanguages, hasKey, isRTL, isRTLLanguage, loadLanguage, loadTranslations, onChange, plural, setLanguage, setupI18n, t, tLang, tLangAsync, tParse };
