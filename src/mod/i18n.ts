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
                if (this.storage) {
                    const stored = await this.storage.get('i18n-language');
                    if (stored && this.supportedLanguages.has(stored)) {
                        this.currentLanguage = stored;
                    }
                }
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
                // Try current language
                if (this.translations[this.currentLanguage]?.[key]) {
                    const value = this.translations[this.currentLanguage][key];
                    return value;
                }

                // Try default language
                if (this.defaultLanguage !== this.currentLanguage &&
                    this.translations[this.defaultLanguage]?.[key]) {
                    const value = this.translations[this.defaultLanguage][key];
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
                const original = this.currentLanguage;
                this.currentLanguage = lang;
                
                const result = this.t(key, params, fallback);
                
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
            public async setLanguage(lang: types.LanguageCode, _setLang = true, _setDir = true, _setCookie = true): Promise<void> {
                if (!this.supportedLanguages.has(lang)) {
                    console.warn(`[i18n] Language "${lang}" not supported, aborting setLanguage()`);
                    return;
                }

                this.currentLanguage = lang;

                // Persist if storage available
                if (this.storage) {
                    await this.storage.set('i18n-language', lang);
                }

                // client
                if( typeof document !== 'undefined' ) {
                    // cookie
                    if( _setCookie ) setCookie('lang', lang, 365);

                    // html lang attribute
                    if( _setLang ) document.documentElement.lang = lang;

                    // dir attr
                    if( _setDir ) document.documentElement.dir = this.isRTL() ? 'rtl' : 'ltr';
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
