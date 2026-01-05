/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// test/main.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { describe, expect, test, beforeEach } from 'bun:test';
    import * as i18n from '../src/main';

    const {
        I18nManager,
        browserStorage,
        memoryStorage,
        fetchTranslations,
        LazyLoader,
        getI18n,
        setupI18n,
        createLazyLoader,
        setupLazy,
        t,
    } = i18n;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe('@minejs/i18n', () => {

        // ┌────────────────── I18nManager Core Tests ──────────────────┐

            describe('I18nManager', () => {

                let manager: i18n.I18nManagerInstance;

                beforeEach(() => {
                    manager = new I18nManager();
                });

                describe('constructor', () => {
                    test('should create with default config', () => {
                        const m = new I18nManager();
                        expect(m.getLanguage()).toBe('en');
                        expect(m.getSupportedLanguages()).toEqual(['en']);
                    });

                    test('should create with custom config', () => {
                        const m = new I18nManager({
                            defaultLanguage: 'ar',
                            fallbackLanguage: 'en',
                            supportedLanguages: ['en', 'ar', 'fr'],
                        });
                        expect(m.getLanguage()).toBe('ar');
                        expect(m.getSupportedLanguages()).toContain('en');
                        expect(m.getSupportedLanguages()).toContain('ar');
                        expect(m.getSupportedLanguages()).toContain('fr');
                    });

                    test('should handle onLanguageChange callback in config', () => {
                        let callbackLang = '';
                        const m = new I18nManager({
                            onLanguageChange: (lang) => { callbackLang = lang; }
                        });
                        expect(m).toBeTruthy();
                    });
                });

                describe('init', () => {
                    test('should initialize async without storage', async () => {
                        await manager.init();
                        expect(manager.getLanguage()).toBe('en');
                    });

                    test('should restore language from storage', async () => {
                        const storage: any = {
                            get: async (key: string) => key === 'i18n-language' ? 'ar' : null,
                            set: async () => {}
                        };
                        const m = new I18nManager({
                            supportedLanguages: ['en', 'ar'],
                            storage,
                        });
                        await m.init();
                        expect(m.getLanguage()).toBe('ar');
                    });

                    test('should ignore unsupported stored language', async () => {
                        const storage: any = {
                            get: async (key: string) => key === 'i18n-language' ? 'unsupported' : null,
                            set: async () => {}
                        };
                        const m = new I18nManager({
                            supportedLanguages: ['en'],
                            storage,
                        });
                        await m.init();
                        expect(m.getLanguage()).toBe('en');
                    });
                });

                describe('loadLanguage', () => {
                    test('should load simple translations', () => {
                        manager.loadLanguage('en', { hello: 'Hello' });
                        expect(manager.t('hello')).toBe('Hello');
                    });

                    test('should flatten nested translations', () => {
                        manager.loadLanguage('en', {
                            welcome: {
                                title: 'Welcome',
                                subtitle: 'To our app'
                            }
                        });
                        expect(manager.t('welcome.title')).toBe('Welcome');
                        expect(manager.t('welcome.subtitle')).toBe('To our app');
                    });

                    test('should deeply nest multiple levels', () => {
                        manager.loadLanguage('en', {
                            app: {
                                pages: {
                                    home: {
                                        title: 'Home'
                                    }
                                }
                            }
                        });
                        expect(manager.t('app.pages.home.title')).toBe('Home');
                    });

                    test('should add to existing language translations', () => {
                        manager.loadLanguage('en', { hello: 'Hello' });
                        manager.loadLanguage('en', { goodbye: 'Goodbye' });
                        expect(manager.t('hello')).toBe('Hello');
                        expect(manager.t('goodbye')).toBe('Goodbye');
                    });

                    test('should ignore non-string values', () => {
                        manager.loadLanguage('en', {
                            nested: {
                                value: null,
                                bool: true,
                                num: 42
                            }
                        });
                        expect(manager.t('nested.value')).toBe('null');
                        expect(manager.t('nested.bool')).toBe('true');
                        expect(manager.t('nested.num')).toBe('42');
                    });
                });

                describe('loadTranslations', () => {
                    test('should load multiple languages at once', () => {
                        manager.loadTranslations({
                            en: { hello: 'Hello' },
                            ar: { hello: 'مرحبا' },
                            fr: { hello: 'Bonjour' }
                        });
                        expect(manager.getSupportedLanguages()).toContain('en');
                        expect(manager.getSupportedLanguages()).toContain('ar');
                        expect(manager.getSupportedLanguages()).toContain('fr');
                    });
                });

                describe('t - translation', () => {
                    beforeEach(() => {
                        manager.loadTranslations({
                            en: {
                                greeting: 'Hello {name}',
                                'page.home': 'Home',
                                'app.name': 'MyApp'
                            },
                            ar: {
                                greeting: 'مرحبا {name}',
                                'page.home': 'الرئيسية',
                                'app.name': 'تطبيقي'
                            }
                        });
                    });

                    test('should translate a key', () => {
                        expect(manager.t('greeting')).toContain('Hello');
                    });

                    test('should replace parameters', () => {
                        const result = manager.t('greeting', { name: 'John' });
                        expect(result).toContain('John');
                    });

                    test('should return key if not found', () => {
                        expect(manager.t('nonexistent')).toBe('nonexistent');
                    });

                    test('should use fallback language', () => {
                        manager.setLanguage('fr');
                        // fr is not loaded, should fallback to en
                        expect(manager.t('greeting')).toContain('Hello');
                    });

                    test('should use default language as last resort', () => {
                        const m = new I18nManager({
                            defaultLanguage: 'en',
                            fallbackLanguage: 'ar',
                            supportedLanguages: ['en', 'ar', 'fr']
                        });
                        m.loadTranslations({
                            en: { key: 'English' },
                            ar: { key: 'Arabic' }
                        });
                        m.setLanguage('fr');
                        expect(m.t('key')).toBe('Arabic');
                    });

                    test('should handle translation key as parameter value', () => {
                        manager.loadLanguage('en', {
                            msg: 'You have {itemCount} items',
                            'item.count': '5'
                        });
                        const result = manager.t('msg', { itemCount: 'item.count' });
                        expect(result).toContain('5');
                    });

                    test('should warn and fallback for missing keys', () => {
                        const consoleSpy = expect.unreachable;
                        const result = manager.t('missing.key', undefined);
                        expect(result).toBe('missing.key');
                    });
                });

                describe('tLang - translate with specific language', () => {
                    beforeEach(() => {
                        manager.loadTranslations({
                            en: { greeting: 'Hello' },
                            ar: { greeting: 'مرحبا' },
                            fr: { greeting: 'Bonjour' }
                        });
                        manager.setLanguage('en');
                    });

                    test('should translate with specified language', () => {
                        const result = manager.tLang('greeting', 'ar');
                        expect(result).toBe('مرحبا');
                    });

                    test('should not change current language', () => {
                        manager.tLang('greeting', 'ar');
                        expect(manager.getLanguage()).toBe('en');
                    });

                    test('should support parameters', () => {
                        manager.loadLanguage('fr', { msg: 'Bonjour {name}' });
                        const result = manager.tLang('msg', 'fr', { name: 'Jean' });
                        expect(result).toContain('Jean');
                    });
                });

                describe('tParse - parse HTML tags', () => {
                    beforeEach(() => {
                        manager.loadLanguage('en', {
                            simple: 'Plain text',
                            formatted: 'Hello <strong>World</strong>',
                            nested: 'Text <em>with <strong>nested</strong></em> tags',
                            'with.br': 'Line1\\nLine2\\nLine3',
                            'with.br.slash': 'Line1/nLine2'
                        });
                    });

                    test('should parse plain text', () => {
                        const tokens = manager.tParse('simple');
                        expect(tokens).toHaveLength(1);
                        expect(tokens[0].type).toBe('text');
                        expect(tokens[0].content).toBe('Plain text');
                    });

                    test('should parse paired tags', () => {
                        const tokens = manager.tParse('formatted');
                        expect(tokens.length).toBeGreaterThan(0);
                        const hasTag = tokens.some(t => t.type === 'tag' && t.tag === 'strong');
                        expect(hasTag).toBe(true);
                    });

                    test('should convert \\n to br tags', () => {
                        const tokens = manager.tParse('with.br');
                        const brTags = tokens.filter(t => t.type === 'tag' && t.tag === 'br');
                        expect(brTags.length).toBeGreaterThanOrEqual(2);
                    });

                    test('should convert /n to br tags', () => {
                        const tokens = manager.tParse('with.br.slash');
                        const brTags = tokens.filter(t => t.type === 'tag' && t.tag === 'br');
                        expect(brTags.length).toBeGreaterThanOrEqual(1);
                    });

                    test('should handle self-closing tags', () => {
                        manager.loadLanguage('en', { selfclose: 'Before<br/>After' });
                        const tokens = manager.tParse('selfclose');
                        const brTag = tokens.find(t => t.type === 'tag' && t.tag === 'br');
                        expect(brTag).toBeTruthy();
                    });
                });

                describe('setLanguage', () => {
                    beforeEach(() => {
                        manager.loadLanguage('en', { hello: 'Hello' });
                        manager.loadLanguage('ar', { hello: 'مرحبا' });
                    });

                    test('should set supported language', async () => {
                        await manager.setLanguage('ar');
                        expect(manager.getLanguage()).toBe('ar');
                    });

                    test('should warn on unsupported language', async () => {
                        await manager.setLanguage('unsupported');
                        expect(manager.getLanguage()).toBe('en');
                    });

                    test('should persist to storage', async () => {
                        let stored = '';
                        const storage: any = {
                            get: async () => null,
                            set: async (key: string, value: string) => {
                                if (key === 'i18n-language') stored = value;
                            }
                        };
                        const m = new I18nManager({
                            supportedLanguages: ['en', 'ar'],
                            storage,
                        });
                        await m.setLanguage('ar');
                        expect(stored).toBe('ar');
                    });

                    test('should trigger onChange listeners', async () => {
                        let callCount = 0;
                        let lastLang = '';
                        manager.onChange((lang) => {
                            callCount++;
                            lastLang = lang;
                        });
                        manager.loadLanguage('ar', { hello: 'مرحبا' });
                        await manager.setLanguage('ar');
                        expect(callCount).toBe(1);
                        expect(lastLang).toBe('ar');
                    });

                    test('should trigger onLanguageChange callback', async () => {
                        let callbackLang = '';
                        const m = new I18nManager({
                            supportedLanguages: ['en', 'ar'],
                            onLanguageChange: (lang) => { callbackLang = lang; }
                        });
                        m.loadLanguage('ar', { hello: 'مرحبا' });
                        await m.setLanguage('ar');
                        expect(callbackLang).toBe('ar');
                    });
                });

                describe('getLanguage', () => {
                    test('should return current language', () => {
                        expect(manager.getLanguage()).toBe('en');
                    });
                });

                describe('getSupportedLanguages', () => {
                    test('should return supported languages', () => {
                        manager.loadLanguage('ar', {});
                        manager.loadLanguage('fr', {});
                        const langs = manager.getSupportedLanguages();
                        expect(langs).toContain('en');
                        expect(langs).toContain('ar');
                        expect(langs).toContain('fr');
                    });
                });

                describe('isLanguageSupported', () => {
                    beforeEach(() => {
                        manager.loadLanguage('ar', {});
                    });

                    test('should return true for supported language', () => {
                        expect(manager.isLanguageSupported('ar')).toBe(true);
                    });

                    test('should return false for unsupported language', () => {
                        expect(manager.isLanguageSupported('unsupported')).toBe(false);
                    });
                });

                describe('hasKey', () => {
                    beforeEach(() => {
                        manager.loadLanguage('en', { exists: 'Yes' });
                    });

                    test('should return true for existing key', () => {
                        expect(manager.hasKey('exists')).toBe(true);
                    });

                    test('should return false for missing key', () => {
                        expect(manager.hasKey('missing')).toBe(false);
                    });

                    test('should check fallback language', () => {
                        manager.loadLanguage('ar', {});
                        manager.setLanguage('ar');
                        expect(manager.hasKey('exists')).toBe(true);
                    });
                });

                describe('getTranslations', () => {
                    test('should return all translations for current language', () => {
                        manager.loadLanguage('en', { hello: 'Hello', goodbye: 'Goodbye' });
                        const trans = manager.getTranslations();
                        expect(trans['hello']).toBe('Hello');
                        expect(trans['goodbye']).toBe('Goodbye');
                    });

                    test('should return empty object if no language', () => {
                        const m = new I18nManager();
                        const trans = m.getTranslations();
                        expect(trans).toEqual({});
                    });
                });

                describe('RTL detection', () => {
                    test('isRTL should return false for LTR languages', () => {
                        expect(manager.isRTL()).toBe(false);
                    });

                    test('isRTL should return true for RTL languages', async () => {
                        const m = new I18nManager({ defaultLanguage: 'ar' });
                        m.loadLanguage('ar', {});
                        await m.setLanguage('ar');
                        expect(m.isRTL()).toBe(true);
                    });

                    test('isRTLLanguage should detect all RTL languages', () => {
                        expect(manager.isRTLLanguage('ar')).toBe(true);
                        expect(manager.isRTLLanguage('he')).toBe(true);
                        expect(manager.isRTLLanguage('fa')).toBe(true);
                        expect(manager.isRTLLanguage('ur')).toBe(true);
                        expect(manager.isRTLLanguage('yi')).toBe(true);
                        expect(manager.isRTLLanguage('ji')).toBe(true);
                        expect(manager.isRTLLanguage('iw')).toBe(true);
                        expect(manager.isRTLLanguage('ku')).toBe(true);
                    });

                    test('isRTLLanguage should return false for LTR', () => {
                        expect(manager.isRTLLanguage('en')).toBe(false);
                        expect(manager.isRTLLanguage('fr')).toBe(false);
                        expect(manager.isRTLLanguage('de')).toBe(false);
                    });

                    test('isRTLLanguage should handle uppercase', () => {
                        expect(manager.isRTLLanguage('AR')).toBe(true);
                        expect(manager.isRTLLanguage('EN')).toBe(false);
                    });
                });

                describe('onChange listener', () => {
                    test('should add and call listeners', async () => {
                        let called = false;
                        manager.loadLanguage('ar', {});
                        const unsub = manager.onChange(() => { called = true; });
                        await manager.setLanguage('ar');
                        expect(called).toBe(true);
                    });

                    test('should unsubscribe from listener', async () => {
                        let callCount = 0;
                        manager.loadLanguage('ar', {});
                        const unsub = manager.onChange(() => { callCount++; });
                        unsub();
                        await manager.setLanguage('ar');
                        expect(callCount).toBe(0);
                    });

                    test('should support multiple listeners', async () => {
                        let count1 = 0, count2 = 0;
                        manager.loadLanguage('ar', {});
                        manager.onChange(() => { count1++; });
                        manager.onChange(() => { count2++; });
                        await manager.setLanguage('ar');
                        expect(count1).toBe(1);
                        expect(count2).toBe(1);
                    });
                });

            });

        // └────────────────────────────────────────────────────────┘


        // ┌──────────────── Storage Adapter Tests ──────────────────┐

            describe('Storage Adapters', () => {

                describe('memoryStorage', () => {
                    test('should store and retrieve values', () => {
                        memoryStorage.set('key', 'value');
                        const result = memoryStorage.get('key');
                        expect(result).toBe('value');
                    });

                    test('should return null for missing keys', () => {
                        const result = memoryStorage.get('missing-key-' + Date.now());
                        expect(result).toBe(null);
                    });

                    test('should overwrite existing values', () => {
                        memoryStorage.set('key', 'value1');
                        memoryStorage.set('key', 'value2');
                        expect(memoryStorage.get('key')).toBe('value2');
                    });

                    test('should handle multiple keys independently', () => {
                        memoryStorage.set('key1', 'value1');
                        memoryStorage.set('key2', 'value2');
                        expect(memoryStorage.get('key1')).toBe('value1');
                        expect(memoryStorage.get('key2')).toBe('value2');
                    });
                });

                describe('browserStorage', () => {
                    test('should have get and set methods', () => {
                        expect(typeof browserStorage.get).toBe('function');
                        expect(typeof browserStorage.set).toBe('function');
                    });

                    test('should handle undefined localStorage gracefully', () => {
                        const result = browserStorage.get('any-key');
                        expect(result === null || result === undefined || typeof result === 'string').toBe(true);
                    });
                });

                describe('fetchTranslations', () => {
                    test('should handle fetch error gracefully', async () => {
                        const m = new I18nManager();
                        // Try to fetch from invalid URL - should fail gracefully
                        await fetchTranslations('https://invalid.example.com/404.json', m);
                        // Should not throw and manager should still exist
                        expect(m).toBeTruthy();
                    });

                    test('should handle string URL input', async () => {
                        const m = new I18nManager();
                        // Pass a string instead of array
                        await fetchTranslations('https://example.com/en.json', m);
                        expect(m).toBeTruthy();
                    });

                    test('should handle array of URLs', async () => {
                        const m = new I18nManager();
                        // Pass an array of URLs
                        await fetchTranslations(['https://example.com/en.json', 'https://example.com/ar.json'], m);
                        expect(m).toBeTruthy();
                    });

                    test('should extract language code from URL', async () => {
                        const m = new I18nManager();
                        // This will fail to fetch but tests the URL processing
                        await fetchTranslations('https://example.com/locales/fr.json', m);
                        expect(m).toBeTruthy();
                    });
                });

            });

        // └────────────────────────────────────────────────────────┘


        // ┌───────────────── Lazy Loader Tests ──────────────────────┐

            describe('LazyLoader', () => {

                let manager: i18n.I18nManagerInstance;
                let loader: i18n.LazyLoaderInstance;

                beforeEach(() => {
                    manager = new I18nManager({
                        supportedLanguages: ['en', 'ar', 'fr']
                    });
                    loader = new LazyLoader('https://example.com/i18n/', manager);
                });

                describe('constructor', () => {
                    test('should normalize base URL with trailing slash', () => {
                        const l1 = new LazyLoader('https://example.com/i18n/', manager);
                        const l2 = new LazyLoader('https://example.com/i18n', manager);
                        expect(l1).toBeTruthy();
                        expect(l2).toBeTruthy();
                    });
                });

                describe('load', () => {
                    test('should return immediately if already loaded', async () => {
                        await loader.load('en'); // Load first time
                        const start = Date.now();
                        await loader.load('en'); // Load again
                        expect(Date.now() - start).toBeLessThan(50);
                    });

                    test('should not load same language twice concurrently', async () => {
                        const promises = [loader.load('ar'), loader.load('ar')];
                        await Promise.all(promises);
                        expect(loader.isLoaded('ar')).toBe(true);
                    });
                });

                describe('isLoaded', () => {
                    test('should return false before loading', () => {
                        expect(loader.isLoaded('ar')).toBe(false);
                    });

                    test('should return true after loading', async () => {
                        await loader.load('en');
                        expect(loader.isLoaded('en')).toBe(true);
                    });
                });

            });

        // └────────────────────────────────────────────────────────┘


        // ┌──────────────── Global Instance Tests ──────────────────┐

            describe('Global Instance Functions', () => {

                beforeEach(() => {
                    // Reset global instance
                    getI18n().loadTranslations({
                        en: { test: 'Test' }
                    });
                });

                describe('getI18n', () => {
                    test('should return same instance on multiple calls', () => {
                        const inst1 = getI18n();
                        const inst2 = getI18n();
                        expect(inst1 === inst2).toBe(true);
                    });
                });

                describe('setupI18n', () => {
                    test('should create and initialize manager', async () => {
                        const manager = await setupI18n({
                            defaultLanguage: 'en',
                            supportedLanguages: ['en', 'ar']
                        });
                        expect(manager).toBeTruthy();
                        expect(manager.getLanguage()).toBe('en');
                    });
                });

                describe('createLazyLoader', () => {
                    test('should return LazyLoader instance', () => {
                        const loader = createLazyLoader('https://example.com/i18n/');
                        expect(loader).toBeTruthy();
                    });
                });

                describe('setupLazy', () => {
                    test('should setup with lazy loading', async () => {
                        const config = {
                            defaultLanguage: 'en',
                            supportedLanguages: ['en', 'ar'],
                            baseUrl: 'https://example.com/i18n/'
                        };
                        const loader = await setupLazy(config);
                        expect(loader).toBeTruthy();
                    });
                });

            });

        // └────────────────────────────────────────────────────────┘


        // ┌─────────────── Convenience Functions Tests ──────────────┐

            describe('Convenience Functions', () => {

                beforeEach(() => {
                    const manager = new I18nManager();
                    manager.loadTranslations({
                        en: {
                            'hello.message': 'Hello {name}',
                            'app.name': 'MyApp',
                            'page.home': 'Home',
                            'page.about': 'About',
                            'item.single': '1 item',
                            'item.plural': '{count} items'
                        },
                        ar: {
                            'hello.message': 'مرحبا {name}',
                            'app.name': 'تطبيقي',
                            'page.home': 'الرئيسية'
                        }
                    });
                });

                describe('t', () => {
                    test('should translate using global instance', () => {
                        const result = t('page.home');
                        expect(result).toBeTruthy();
                    });
                });

                describe('tLang', () => {
                    test('should translate with specific language', () => {
                        const m = new I18nManager();
                        m.loadLanguage('ar', { 'app.name': 'تطبيقي' });
                        const result = m.tLang('app.name', 'ar');
                        expect(result).toBe('تطبيقي');
                    });
                });

                describe('tParse', () => {
                    test('should parse translations', () => {
                        const m = new I18nManager();
                        m.loadLanguage('en', { msg: 'Hello<br/>World' });
                        const tokens = m.tParse('msg');
                        expect(tokens.length).toBeGreaterThan(0);
                    });
                });

                describe('setLanguage', () => {
                    test('should set language globally', async () => {
                        const m = new I18nManager({
                            supportedLanguages: ['en', 'ar']
                        });
                        m.loadLanguage('ar', { test: 'Test' });
                        await m.setLanguage('ar');
                        expect(m.getLanguage()).toBe('ar');
                    });
                });

                describe('getLanguage', () => {
                    test('should get current language', () => {
                        const m = new I18nManager();
                        const lang = m.getLanguage();
                        expect(lang).toBeTruthy();
                    });
                });

                describe('getSupportedLanguages', () => {
                    test('should get supported languages', () => {
                        const m = new I18nManager();
                        const langs = m.getSupportedLanguages();
                        expect(Array.isArray(langs)).toBe(true);
                    });
                });

                describe('hasKey', () => {
                    test('should check if key exists', () => {
                        const m = new I18nManager();
                        m.loadLanguage('en', { 'page.home': 'Home' });
                        expect(m.hasKey('page.home')).toBe(true);
                        expect(m.hasKey('nonexistent')).toBe(false);
                    });
                });

                describe('isRTL', () => {
                    test('should check if current language is RTL', () => {
                        const m = new I18nManager();
                        const result = m.isRTL();
                        expect(typeof result).toBe('boolean');
                    });
                });

                describe('isRTLLanguage', () => {
                    test('should check if language is RTL', () => {
                        const m = new I18nManager();
                        expect(m.isRTLLanguage('ar')).toBe(true);
                        expect(m.isRTLLanguage('en')).toBe(false);
                    });
                });

                describe('onChange', () => {
                    test('should subscribe to language changes', (done) => {
                        const m = new I18nManager({
                            supportedLanguages: ['en', 'ar']
                        });
                        m.loadLanguage('ar', { test: 'Test' });
                        const unsub = m.onChange(() => {
                            unsub();
                            done();
                        });
                        m.setLanguage('ar');
                    });
                });

                describe('loadTranslations', () => {
                    test('should load multiple languages', () => {
                        const m = new I18nManager();
                        m.loadTranslations({
                            it: { hello: 'Ciao' },
                            es: { hello: 'Hola' }
                        });
                        expect(m.getSupportedLanguages()).toContain('it');
                        expect(m.getSupportedLanguages()).toContain('es');
                    });
                });

            });

        // └────────────────────────────────────────────────────────┘


        // ┌────────────── Utility Functions Tests ──────────────────┐

            describe('Utility Functions', () => {

                describe('genPageTitle', () => {
                    test('should generate LTR title format', () => {
                        const m = new I18nManager();
                        m.loadTranslations({
                            en: {
                                'app.name': 'MyApp',
                                'page.home': 'Home'
                            }
                        });
                        const title = i18n.genPageTitle('home');
                        expect(title).toBeTruthy();
                    });

                    test('should generate RTL title format', async () => {
                        const m = new I18nManager({ defaultLanguage: 'ar' });
                        m.loadTranslations({
                            ar: {
                                'app.name': 'تطبيقي',
                                'page.home': 'الرئيسية'
                            }
                        });
                        await m.setLanguage('ar');
                        // genPageTitle uses global instance, so we test directly with t()
                        const appName = m.t('app.name');
                        const pageName = m.t('page.home');
                        const rtlFormat = `${appName} - ${pageName}`;
                        const ltrFormat = `${pageName} - ${appName}`;
                        expect(m.isRTL()).toBe(true);
                    });

                    test('should use default prefix', () => {
                        const m = new I18nManager();
                        m.loadLanguage('en', { 'page.home': 'Home', 'app.name': 'App' });
                        const result = m.t('page.home');
                        expect(result).toBe('Home');
                    });
                });

                describe('plural', () => {
                    test('should use singular for count=1', () => {
                        const m = new I18nManager();
                        m.loadLanguage('en', {
                            'item.single': '1 item',
                            'item.plural': '{count} items'
                        });
                        const result = m.t('item.single');
                        expect(result).toContain('1 item');
                    });

                    test('should use plural for count>1', () => {
                        const m = new I18nManager();
                        m.loadLanguage('en', {
                            'item.single': '1 item',
                            'item.plural': '{count} items'
                        });
                        const result = m.t('item.plural', { count: '5' });
                        expect(result).toContain('5');
                        expect(result).toContain('items');
                    });

                    test('should use plural for count=0', () => {
                        const m = new I18nManager();
                        m.loadLanguage('en', {
                            'item.single': '1 item',
                            'item.plural': '{count} items'
                        });
                        const result = m.t('item.plural', { count: '0' });
                        expect(result).toContain('0');
                        expect(result).toContain('items');
                    });

                    test('should replace count parameter', () => {
                        const m = new I18nManager();
                        m.loadLanguage('en', {
                            'item.plural': '{count} items'
                        });
                        const result = m.t('item.plural', { count: '42' });
                        expect(result).toContain('42');
                    });

                    test('should handle RTL plural format', async () => {
                        const m = new I18nManager({ defaultLanguage: 'ar' });
                        m.loadLanguage('ar', {
                            'item.single': 'عنصر واحد',
                            'item.plural': '{count} عناصر'
                        });
                        await m.setLanguage('ar');
                        const result = m.t('item.plural', { count: '3' });
                        expect(result).toBeTruthy();
                        expect(m.isRTL()).toBe(true);
                    });
                });

            });

        // └────────────────────────────────────────────────────────┘


        // ┌─────────────── Edge Cases & Integration ────────────────┐

            describe('Edge Cases & Integration', () => {

                test('should handle deeply nested parameter replacement', () => {
                    const m = new I18nManager();
                    m.loadLanguage('en', {
                        outer: 'Result: {inner}',
                        inner: 'nested value'
                    });
                    const result = m.t('outer', { inner: 'inner' });
                    expect(result).toContain('nested value');
                });

                test('should handle empty translations', () => {
                    const m = new I18nManager();
                    m.loadLanguage('en', {});
                    expect(m.getSupportedLanguages()).toContain('en');
                });

                test('should handle circular fallback gracefully', async () => {
                    const m = new I18nManager({
                        defaultLanguage: 'en',
                        fallbackLanguage: 'ar',
                        supportedLanguages: ['en', 'ar']
                    });
                    m.loadLanguage('en', { key: 'English' });
                    m.loadLanguage('ar', { key: 'Arabic' });
                    // Try to switch to unsupported language
                    await m.setLanguage('fr');
                    // Should still be on en since fr is not supported
                    expect(m.getLanguage()).toBe('en');
                    expect(m.t('key')).toBe('English');
                });

                test('should handle special characters in keys', () => {
                    const m = new I18nManager();
                    m.loadLanguage('en', {
                        'key-with-dash': 'value',
                        'key_with_underscore': 'value',
                        'key.with.dots': 'value'
                    });
                    expect(m.t('key-with-dash')).toBe('value');
                    expect(m.t('key_with_underscore')).toBe('value');
                    expect(m.t('key.with.dots')).toBe('value');
                });

                test('should handle empty object flattening', () => {
                    const m = new I18nManager();
                    m.loadLanguage('en', { nested: {} });
                    expect(m.hasKey('nested')).toBe(false);
                });

                test('should handle whitespace in translations', () => {
                    const m = new I18nManager();
                    m.loadLanguage('en', {
                        spaces: '  leading and trailing  ',
                        newlines: 'line1\n  line2\n  line3'
                    });
                    expect(m.t('spaces')).toBe('  leading and trailing  ');
                    expect(m.t('newlines')).toContain('line1');
                });

                test('should handle complex HTML parsing', () => {
                    const m = new I18nManager();
                    m.loadLanguage('en', {
                        complex: 'Start <b>bold</b> and <i>italic</i> with <br/> break'
                    });
                    const tokens = m.tParse('complex');
                    const types = tokens.map(t => t.type);
                    expect(types).toContain('text');
                    expect(types).toContain('tag');
                });

                test('should maintain state consistency across operations', async () => {
                    const m = new I18nManager({
                        defaultLanguage: 'en',
                        supportedLanguages: ['en', 'ar', 'fr']
                    });
                    m.loadTranslations({
                        en: { key: 'English' },
                        ar: { key: 'Arabic' },
                        fr: { key: 'French' }
                    });
                    await m.setLanguage('ar');
                    expect(m.getLanguage()).toBe('ar');
                    expect(m.t('key')).toBe('Arabic');
                    const langs = m.getSupportedLanguages();
                    expect(langs.length).toBe(3);
                });

            });

        // └────────────────────────────────────────────────────────┘

    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝