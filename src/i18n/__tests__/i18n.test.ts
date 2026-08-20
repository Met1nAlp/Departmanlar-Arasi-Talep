import { describe, expect, it, beforeEach } from '@jest/globals';
import { t, useLocaleStore } from '../index';

describe('i18n', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'tr' });
  });

  it('varsayılan (tr) çeviriyi döner', () => {
    expect(t('auth.login.submit')).toBe('Giriş Yap');
  });

  it('locale parametresi ile başka dilde çeviri döner', () => {
    expect(t('auth.login.submit', 'en')).toBe('Sign In');
  });

  it('aktif locale değişince t() de değişir', () => {
    useLocaleStore.getState().setLocale('en');
    expect(t('auth.deviceEnroll.title')).toBe('Device Registration');
  });

  it('tr ve en aynı anahtar kümesine sahiptir (eksik çeviri kalmasın)', () => {
    // Derleme zamanında zaten TranslationKey ile garanti ediliyor
    // (en.ts: `export const en: typeof tr = {...}`), burada çalışma zamanı
    // regresyon kontrolü olarak birkaç nokta örneği doğrulanır.
    expect(t('common.retry', 'tr')).toBe('Tekrar Dene');
    expect(t('common.retry', 'en')).toBe('Retry');
  });
});
