// src/mod/i18n.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as types from '../types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class I18nManager {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private translations        : types.TranslationSet = {};
            private currentLanguage     : types.LanguageCode = 'en';
            private defaultLanguage     : types.LanguageCode = 'en';
            private supportedLanguages  = new Set<types.LanguageCode>(['en']);
            private rtlLanguages        = new Set<string>(['ar', 'he', 'fa', 'ur', 'yi', 'ji', 'iw', 'ku']);
            private listeners           = new Set<(lang: types.LanguageCode) => void>();
            private storage?            : types.I18nStorage;
            private onLanguageChange?   : (lang: types.LanguageCode) => void;

            constructor(config?: types.I18nConfig) {
                if (config) {
                    this.defaultLanguage = config.defaultLanguage || 'en';
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
               // console.log('[i18n] Initializing manager...');
               // console.log('[i18n] Current language:', this.currentLanguage);
               // console.log('[i18n] Default language:', this.defaultLanguage);

                if (this.storage) {
                   // console.log('[i18n] Storage available, checking for stored language...');
                    const stored = await this.storage.get('i18n-language');
                   // console.log('[i18n] Stored language from storage:', stored);
                    if (stored && this.supportedLanguages.has(stored)) {
                       // console.log('[i18n] Stored language is supported, setting to:', stored);
                        this.currentLanguage = stored;
                    } else {
                       // console.log('[i18n] Stored language not supported or not found, keeping:', this.currentLanguage);
                    }
                } else {
                   // console.log('[i18n] No storage available');
                }
               // console.log('[i18n] Init complete. Current language:', this.currentLanguage);
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── LOAD ──────────────────────────────┐

            /**
             * Load translations for a specific language
             * @param lang Language code
             * @param translations Translation object (can be nested)
             */
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            public loadLanguage(lang: types.LanguageCode, translations: Record<string, any>): void {
               // console.log(`[i18n] Loading language: "${lang}"`);
               // console.log(`[i18n] Translation keys count:`, Object.keys(translations).length);
                
                if (!this.translations[lang]) {
                    this.translations[lang] = {};
                }

                const flattened = this.flattenObject(translations);
               // console.log(`[i18n] Flattened translation keys count for "${lang}":`, Object.keys(flattened).length);
                
                this.translations[lang] = { ...this.translations[lang], ...flattened };
                this.supportedLanguages.add(lang);
                
               // console.log(`[i18n] Language "${lang}" loaded successfully. Total keys:`, Object.keys(this.translations[lang]).length);
               // console.log(`[i18n] Supported languages:`, Array.from(this.supportedLanguages));
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
             * @param fallback Optional fallback string if key not found
             * @returns Translated string
             */
            public t(key: string, params?: Record<string, string>, fallback?: string): string {

                let translation = this.getTranslation(key, fallback);

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
               // console.log(`[i18n] getTranslation() - Looking up key: "${key}" in language: "${this.currentLanguage}"`);
               // console.log(`[i18n] Translations available for "${this.currentLanguage}":`, this.translations[this.currentLanguage] ? 'YES' : 'NO');
                
                // Try current language
                if (this.translations[this.currentLanguage]?.[key]) {
                    const value = this.translations[this.currentLanguage][key];
                   // console.log(`[i18n] Found in current language "${this.currentLanguage}": "${value}"`);
                    return value;
                }

               // console.log(`[i18n] Translation key "${key}" not found in language "${this.currentLanguage}"`);

                // Try default language
                if (this.defaultLanguage !== this.currentLanguage &&
                    this.translations[this.defaultLanguage]?.[key]) {
                    const value = this.translations[this.defaultLanguage][key];
                   // console.log(`[i18n] Found in default language "${this.defaultLanguage}": "${value}"`);
                    return value;
                }

                // Warn and return fallback
                console.warn(`[i18n] Translation key not found: "${key}" (lang: ${this.currentLanguage})`);
                return fallback || key;
            }

            /**
             * Translate with a specific language temporarily
             *
             * @param lang Language code
             * @param key Translation key
             * @param params Optional parameters
             * @param fallback Optional fallback string if key not found
             */
            public tLang(lang: types.LanguageCode, key: string, params?: Record<string, string>, fallback?: string): string {
               // console.log(`[i18n] tLang() called: lang="${lang}", key="${key}"`);
               // console.log(`[i18n] Current language before switch: "${this.currentLanguage}"`);
               // console.log(`[i18n] Available translations for "${lang}":`, this.translations[lang] ? Object.keys(this.translations[lang]).slice(0, 5) : 'NONE');
                
                const original = this.currentLanguage;
                this.currentLanguage = lang;
               // console.log(`[i18n] Temporarily switched to: "${lang}"`);
                
                const result = this.t(key, params, fallback);
                
                this.currentLanguage = original;
               // console.log(`[i18n] Switched back to original language: "${original}"`);
               // console.log(`[i18n] tLang() result for key "${key}":`, result);
                
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
             * @param fallback Optional fallback string if key not found
             * @returns Array of tokens
             */
            public tParse(key: string, params?: Record<string, string>, fallback?: string): types.TranslationToken[] {
                let translation = this.t(key, params, fallback);
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
               // console.log(`[i18n] setLanguage() called with lang: "${lang}"`);
               // console.log(`[i18n] Checking if "${lang}" is supported...`);
               // console.log(`[i18n] Supported languages:`, Array.from(this.supportedLanguages));
                
                if (!this.supportedLanguages.has(lang)) {
                    console.warn(`[i18n] Language "${lang}" not supported, aborting setLanguage()`);
                    return;
                }

               // console.log(`[i18n] Language "${lang}" is supported. Setting current language...`);
                this.currentLanguage = lang;
               // console.log(`[i18n] Current language set to: "${lang}"`);

                // Persist if storage available
                if (this.storage) {
                   // console.log(`[i18n] Persisting language "${lang}" to storage...`);
                    await this.storage.set('i18n-language', lang);
                   // console.log(`[i18n] Language persisted to storage`);
                } else {
                   // console.log(`[i18n] No storage available for persistence`);
                }

                // client
                if( typeof document !== 'undefined' ) {
                    // cookie
                    setCookie('lang', lang, 365);

                    // html lang attribute
                    document.documentElement.lang = lang;
                   // console.log(`[i18n] Set document.lang to "${lang}"`);
                }

                // Notify listeners
               // console.log(`[i18n] Notifying ${this.listeners.size} listeners...`);
                this.listeners.forEach(fn => fn(lang));

                if (this.onLanguageChange) {
                   // console.log(`[i18n] Calling onLanguageChange callback...`);
                    this.onLanguageChange(lang);
                }
                
               // console.log(`[i18n] setLanguage() completed for "${lang}"`);
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



// ╔════════════════════════════════════════ HELP ════════════════════════════════════════╗

    // Function to set a cookie with name, value, and days to expire
    function setCookie(name: string, value: string, days: number) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
