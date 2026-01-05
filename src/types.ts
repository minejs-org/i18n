// src/types.d.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type LanguageCode    = string;

    export type TranslationSet  = Record<string, Record<string, string>>;

    export interface I18nConfig {
        defaultLanguage?        : LanguageCode;
        supportedLanguages?     : LanguageCode[];
        fallbackLanguage?       : LanguageCode;
        onLanguageChange?       : (lang: LanguageCode) => void;
        storage?                : I18nStorage;
        basePath?               : string;
        fileExtension?          : string;
    }

    export interface I18nStorage {
        get(key: string)                    : string | null | Promise<string | null>;
        set(key: string, value: string)     : void | Promise<void>;
    }

    export interface TranslationToken {
        type                    : 'text' | 'tag';
        tag?                    : string;
        content                 : string;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝