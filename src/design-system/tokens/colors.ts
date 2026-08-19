// src/design-system/tokens/colors.ts
//
// Plan §16.2 renk sistemi burada AÇIK TEMAYA uyarlanmıştır (bkz. proje kararı:
// MTS_Mobil_UI_Tasarım mockup'ları açık zemin kullanıyor — dark "surface-base"
// spesifikasyonu yerine mockup'ların görsel dili esas alındı, ama "renk =
// dekorasyon değil durum kodudur" kuralı ve durum semantiği (bekliyor/işlemde/
// yolda/başarılı/tehlike/nötr) birebir korunuyor). Aynı ekranda en fazla 2
// durum rengi görünmeli — bu kural token'larda değil, ekran kompozisyonunda
// uygulanır.

export const colors = {
  white: '#FFFFFF',
  black: '#000000',
  blue: '#0057B8',

  blueLight: '#E6F0FA',
  blueMedium: '#4D8FDB',
  blueDark: '#003F7D',

  textPrimary: '#000000',
  textSecondary: '#4A4A4A',
  textMuted: '#8A8A8A',

  border: '#E0E0E0',
  background: '#FFFFFF',
  surface: '#F7F9FC',

  danger: '#B3261E',
  dangerLight: '#FBEAE9',
  warning: '#8A5A00',
  warningLight: '#FFF4D6',

  // Plan §16.2 durum semantiği — açık temaya uyarlanmış 6 durum rengi.
  // Kart durum şeridi, PriorityBadge, StatusChip bu paletten okur.
  statePending: '#0057B8', // bekliyor — mavi (mevcut marka rengiyle aynı)
  stateActive: '#B45309', // hazırlanıyor / işlemde — amber (metin okunabilir koyulukta)
  stateActiveBg: '#FFF4D6',
  stateTransit: '#6D28D9', // yolda — mor
  stateTransitBg: '#F0E9FE',
  stateSuccess: '#15803D', // tamamlandı / doğru — yeşil
  stateSuccessBg: '#E7F6EC',
  stateDanger: '#DC2626', // hat durdu / hata / yanlış parça — kırmızı
  stateDangerBg: '#FDE9E9',
  stateNeutral: '#6B7280', // iptal / arşiv / planlı — gri
  stateNeutralBg: '#F1F2F4',
} as const;

export type RequestStatusKey =
  | 'TALEP_ALINDI'
  | 'HAZIRLANIYOR'
  | 'HAZIR'
  | 'YOLDA'
  | 'TESLIM_EDILDI';

export type StatusToken = {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
};

// Plan §16.2 semantiğine göre: bekliyor=mavi, işlemde=amber, hazır=yeşil
// (bir sonraki adıma geçmeye hazır olduğu için "başarı" tonunda), yolda=mor,
// teslim edildi=yeşil (koyu, tamamlanmış nihai durum).
export const statusTokens: Record<RequestStatusKey, StatusToken> = {
  TALEP_ALINDI: {
    color: colors.statePending,
    bgColor: colors.blueLight,
    icon: 'time-outline',
    label: 'Talep Alındı',
  },
  HAZIRLANIYOR: {
    color: colors.stateActive,
    bgColor: colors.stateActiveBg,
    icon: 'cube-outline',
    label: 'Hazırlanıyor',
  },
  HAZIR: {
    color: colors.stateSuccess,
    bgColor: colors.stateSuccessBg,
    icon: 'checkmark-circle-outline',
    label: 'Hazır',
  },
  YOLDA: {
    color: colors.stateTransit,
    bgColor: colors.stateTransitBg,
    icon: 'car-outline',
    label: 'Yolda',
  },
  TESLIM_EDILDI: {
    color: colors.white,
    bgColor: colors.stateSuccess,
    icon: 'checkmark-done-outline',
    label: 'Teslim Edildi',
  },
};
