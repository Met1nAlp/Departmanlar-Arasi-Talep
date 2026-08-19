// src/i18n/index.ts
//
// Hafif, bağımlılıksız i18n katmanı. Proje şu an tek bir mock-backend +
// offline-first mimariye odaklandığından (bkz. CLAUDE.md/AGENTS.md), harici
// bir i18n kütüphanesi (react-i18next vb.) eklemek yeni bir native/npm
// bağımlılığı ve bu makinede tekrar yaşanan "npm install" sürtünmesi
// anlamına geliyordu (bkz. proje notları). Bunun yerine anahtar/tip güvenli,
// ~50 satırlık kendi çözümümüz var. İleride gerçek i18next'e geçilirse tek
// değişen yer bu dosyadır — ekranlar yalnızca `useTranslation()` çağırır.
import { create } from 'zustand';
import { tr } from './translations/tr';
import { en } from './translations/en';

export type Locale = 'tr' | 'en';

const RESOURCES: Record<Locale, typeof tr> = { tr, en };

// tr.auth.login.title gibi tüm yaprak anahtarları "auth.login.title" biçiminde
// birleştiren tip — çağıranlar yalnızca gerçekten var olan anahtarları yazabilir.
type DotPaths<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`;
    }[keyof T & string];

export type TranslationKey = DotPaths<typeof tr>;

function resolvePath(obj: unknown, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in acc) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, obj);
  return typeof value === 'string' ? value : path;
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// NOT: kalıcı saklama şu an yok — cihaz varsayılanı Türkçe (fabrika sahası).
// İhtiyaç olursa secureStorage.ts deseniyle SecureStore'a yazılabilir.
export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'tr',
  setLocale: (locale) => set({ locale }),
}));

/** Aktif locale dışında da çeviri lazımsa (örn. bildirim metni) kullanılır. */
export function t(key: TranslationKey, locale: Locale = useLocaleStore.getState().locale): string {
  return resolvePath(RESOURCES[locale], key);
}

/** Ekranlarda kullanılacak asıl hook — locale değişince otomatik re-render sağlar. */
export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const translate = (key: TranslationKey) => resolvePath(RESOURCES[locale], key);
  return { t: translate, locale, setLocale };
}
