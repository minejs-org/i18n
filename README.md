<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="60" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.1.1-black"/>
    <a href="https://github.com/minejs-org"><img src="https://img.shields.io/badge/🔥-@minejs-black"/></a>
    <br>
    <img src="https://img.shields.io/badge/coverage-94.12%25-brightgreen" alt="Test Coverage" />
    <img src="https://img.shields.io/github/issues/minejs-org/i18n?style=flat" alt="Github Repo Issues" />
    <img src="https://img.shields.io/github/stars/minejs-org/i18n?style=social" alt="GitHub Repo stars" />
</div>
<br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Overview 👀

    - #### Why ?
        > To unify the translation system and languages ​​on the server and client, faster, cleaner, more maintainable.

    - #### When ?
        > When you need to add a translation to your server or client.

        > When you use [@cruxjs/app](https://github.com/cruxjs-org/app).

    <br>
    <br>

- ## Quick Start 🔥

    > install [`hmm`](https://github.com/minejs-org/hmm) first.

    ```bash
    # in your terminal
    hmm i @minejs/i18n
    ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> </div>

    - #### Setup

      - ##### JSON

        > Save the translation **keys and their values** ​​in `.json` files.

        ```jsonc
        // ./src/shared/dist/u18n/en.json
        {
            "group": {
                "key": "value"
            }
        }
        ```

        ```jsonc
        // ./src/shared/dist/u18n/ar.json
        {
            "group": {
                "key": "قيـمة"
            }
        }
        ```

      - ##### I18n

        > ***🌟 If you are using [`@cruxjs/app`](https://github.com/cruxjs-org/app) you can skip this step. 🌟***

        > Then in your project ***(works with any environment: `server`, `browser`, ..)***
        >
        > Call the `setupI18n(..)` function **only once** in your application's lifecycle :

        ```ts
        import { setupI18n } from `@minejs/i18n`;
        ```

        ```ts
        await this.setupI18n({
            defaultLanguage     : 'en',
            supportedLanguages  : ['en', 'ar'],
            basePath            : '/static/dist/i18n',      // for client side (or your custom public url)
                                : './src/shared/dist/i18n', // for server side (or your custom local path)
        });
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> </div>
        <br>

    - #### Usage

        > Now you can call the `t(..)` function anywhere in your project :

        ```tsx
        import { t } from `@minejs/i18n`;
        ```

        ```ts
        t('key', { params }, fallback) // just it !
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> </div>

        - #### Language Switching

            ```typescript
            import { setLanguage, onChange } from '@minejs/i18n';

            // Listen to changes
            onChange((lang) => {
                console.log('Language changed to:', lang);
                document.documentElement.lang = lang;
                document.dir = isRTL() ? 'rtl' : 'ltr';
            });

            // Change language
            await setLanguage('ar');
            ```

        - #### Parameterized Translations

            ```json
            {
                "greeting": "Hello {name}, you have {count} messages"
            }
            ```

            ```typescript
            t('group.greeting', { name: 'John', count: '5' })
            // "Hello John, you have 5 messages"
            ```

        - #### HTML Tag Parsing

            ```json
            {
                "terms": "I agree to the <link>Terms of Service</link>"
            }
            ```

            ```typescript
            const tokens = tParse('group.terms');
            // [
            //   { type: 'text', content: 'I agree to the ' },
            //   { type: 'tag', tag: 'link', content: 'Terms of Service' }
            // ]
            ```

    <br>
    <br>

- ## Documentation 📑

    - ### API

        - #### Types

            ```typescript
            type LanguageCode           = string;
            ```

            ```typescript
            interface I18nConfig {
                defaultLanguage?        : LanguageCode;
                supportedLanguages?     : LanguageCode[];
                fallbackLanguage?       : LanguageCode;
                onLanguageChange?       : (lang: LanguageCode) => void;
                storage?                : I18nStorage;
                basePath?               : string;
                fileExtension?          : string;
            }
            ```

            ```typescript
            interface TranslationToken {
                type                    : 'text' | 'tag';
                tag?                    : string;
                content                 : string;
            }
            ```

            <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> </div>

        - #### Functions

            - #### `setupI18n(config)`

                > Initialize i18n with auto-detection

                ```typescript
                await setupI18n({
                    defaultLanguage     : 'en',
                    supportedLanguages  : ['en', 'ar', 'fr'],
                    basePath            : '/i18n/',  // URL (browser) or path (server)
                    fileExtension       : 'json' // optional
                });
                ```

            - #### `t(key, params?)`

                > Translate with parameter replacement

                ```typescript
                t('group.greeting', { name: 'John' }) // "Hello John"
                ```

            - #### `tLang(key, lang, params?)`

                > Translate with specific language

                ```typescript
                tLang('group.greeting', 'ar', { name: 'أحمد' })
                ```

            - #### `tParse(key, params?)`

                > Parse translation with HTML tags

                ```typescript
                tParse('group.message') // Returns TokenArray
                ```

            - #### `setLanguage(lang)`

                > Change current language

                ```typescript
                await setLanguage('ar')
                ```

            - #### `getLanguage()`

                > Get current language code

                ```typescript
                const lang = getLanguage() // 'en'
                ```

            - #### `getSupportedLanguages()`

                > Get all supported languages

                ```typescript
                const langs = getSupportedLanguages() // ['en', 'ar', 'fr']
                ```

            - #### `isRTL()`

                > Check if current language is RTL

                ```typescript
                if (isRTL()) { /* Handle RTL layout */ }
                ```

            - #### `onChange(callback)`

                > Subscribe to language changes

                ```typescript
                const unsubscribe = onChange((lang) => console.log('Changed to:', lang))
                ```

            - #### `plural(count, singleKey, pluralKey)`

                > Handle pluralization

                ```typescript
                plural(5, 'item.single', 'item.plural') // "5 items"
                ```

            - #### `hasKey(key)`

                > Check if translation exists

                ```typescript
                if (hasKey('settings.theme')) { /* ... */ }
                ```

            - #### `loadLanguage(lang, translations)`

                > Load translations for a language

                ```typescript
                loadLanguage('en', { greeting: 'Hello' })
                ```

            - #### `loadTranslations(translations)`

                > Load multiple languages at once

                ```typescript
                loadTranslations({
                    en: { greeting: 'Hello' },
                    ar: { greeting: 'مرحبا' }
                })
                ```

            <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> </div>

        - #### Related

            - ##### [@cruxjs/app](https://github.com/cruxjs-org/app)

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>
<br>

---

<div align="center">
    <a href="https://github.com/maysara-elshewehy"><img src="https://img.shields.io/badge/by-Maysara-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->